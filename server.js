require('dotenv').config();
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const nedb = require("@seald-io/nedb")
const cookieParser = require("cookie-parser");
const expressSession = require('express-session')
const nedbSessionStore = require('nedb-promises-session-store')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

let memories = [];

const app = express();
const urlEncodedParser = bodyParser.urlencoded({ extended: true });
const upload = multer({
  dest: "public/uploads",
});

let memoriesdb = new nedb({
  filename: "database/memories.txt",
  autoload: true
})

let modelsdb = new nedb({
  filename: "database/models.txt",
  autoload: true
})

app.use(cookieParser());

const nedbSessionInit = nedbSessionStore({
  connect: expressSession,
  filename: 'database/sessions.txt'
})

app.use(expressSession({
  store: nedbSessionInit,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 365 },
  secret: 'thisismysecretkey',
  resave: false,
  saveUninitialized: false
}))

let userdb = new nedb({
  filename: 'database/userdb.txt',
  autoload: true
})

let islandsdb = new nedb({
  filename: 'database/islands.txt',
  autoload: true
})


app.use(express.static("public"));
app.use(urlEncodedParser);
app.set("view engine", "ejs");

function requiresAuthentication(req, res, next) {
  if (req.session.loggedInUser) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get("/", (req, res) => {
  if (req.session.loggedInUser) {
    res.redirect('/home');
  } else {
    res.redirect('/landing');
  }
});

app.get('/landing', (req, res) => {
  res.render('landing.ejs', {})
})

app.get('/explore', (req, res) => {
  res.redirect('https://carolyuuu.com');
})


app.get('/island', requiresAuthentication, async (req, res) => {
  let username = req.session.loggedInUser;
  let hasIslands = false;
  let userIslands = [];
  if (username) {
    userIslands = await islandsdb.findAsync({ username: username });
    if (userIslands.length > 0) {
      hasIslands = true;
    } 
  }

  if (!hasIslands) {
    res.redirect('/add-island');
  } else {
    res.render('island.ejs', { islands: userIslands })
  }
});

app.get('/add-island', requiresAuthentication, async (req, res) => {
  try {
    const username = req.session.loggedInUser;

    const userMemories = await new Promise((resolve, reject) => {
      memoriesdb.find({ username }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs || []);
        }
      });
    });

    const allModels = await new Promise((resolve, reject) => {
      modelsdb.find({}, (err, docs) => {
        if (err) {
          console.error('Error loading models:', err);
          reject(err);
        } else {
          resolve(docs || []);
        }
      });
    });

    res.render('add-island.ejs', {
      memories: userMemories,
      models: allModels
    });

  } catch (err) {
    console.error('Error in /add-island route:', err);
    res.render('add-island.ejs', { memories: [], models: [] });
  }
});

app.post('/add-island', requiresAuthentication, upload.none(), async (req, res) => {
  if (!req.session.loggedInUser) {
    return res.redirect('/login');
  }

  const username = req.session.loggedInUser;

  const newIsland = {
    name: req.body.name || '',
    model: req.body.model || '',
    color: req.body.color || '1',
    memories: [],
    username: username,
  };

  try {
    let memoryIds = [];
    if (req.body.memories) {
      memoryIds = Array.isArray(req.body.memories)
        ? req.body.memories
        : [req.body.memories];   // ensure array
    }
    const memoryDocs = await Promise.all(
      memoryIds.map(id => memoriesdb.findOne({ _id: id }))
    );

    const insertedIsland = await islandsdb.insertAsync(newIsland);

    for (const memory of memoryDocs) {
      if (!memory) continue; // skip not found

      const updatedIslands = [...(memory.island || []), insertedIsland._id];

      await memoriesdb.updateAsync(
        { _id: memory._id },
        { $set: { island: updatedIslands } }
      );
      insertedIsland.memories.push(memory._id);
    }

    await islandsdb.updateAsync(
      { _id: insertedIsland._id },
      { $set: { memories: insertedIsland.memories } }
    );

    return res.redirect('/home');

  } catch (err) {
    console.error("Error creating island:", err);

    memoriesdb.find({ username }, (err, userMemories) => {
      return res.render('add-island.ejs', { memories: userMemories || [] });
    });
  }
});



app.get('/signup', (req, res) => {
  res.render('signup.ejs', {})
})

app.post('/signup', upload.single('profilePicture'), async (req, res) => {
  const { username, fullname, password, confirmPassword } = req.body;

  if (!username || !fullname || !password || !confirmPassword) {
    return res.redirect('/signup?empty=true');
  }

  if (password !== confirmPassword) {
    return res.redirect('/signup?password=incorrect');
  }

  const existingUser = await userdb.findOne({ username });
  if (existingUser) {
    return res.redirect('/signup?username=exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = { username, fullname, password: hashedPassword };

  userdb.insert(newUser, (err, insertedData) => {
    return res.redirect('/login');
  });
});

app.get('/login', (req, res) => {
  res.render('login.ejs', {})
})

app.post('/login', (req, res) => {
  let loginAttempt = {
    username: req.body.username,
    password: req.body.password
  }

  let searchUser = {
    username: loginAttempt.username
  }

  userdb.findOne(searchUser, (err, foundUser) => {
    if (foundUser == null) {
      res.redirect('/login?user=null')
    } else {
      let encPass = foundUser.password
      if (bcrypt.compareSync(loginAttempt.password, encPass)) {
        let session = req.session
        session.loggedInUser = foundUser.username
        res.redirect('/')
      } else {
        res.redirect('/login?password=incorrect')
      }
    }
  })
})

app.get('/logout', (req, res) => {
  delete req.session.loggedInUser;
  res.redirect('/landing');
})



app.get('/add-memory', requiresAuthentication, async (req, res) => {
  const username = req.session.loggedInUser;
  const emotion = req.query.emotion || '';
  const emotionMap = {
    'anger': 'red',
    'joy': 'yellow',
    'disgust': 'green',
    'sadness': 'blue',
    'fear': 'purple'
  };
  const emotionValue = emotionMap[emotion] || '';

  let userIslands = [];
  if (username) {
    userIslands = await islandsdb.findAsync({ username: username });
    
  }
  console.log('islands', userIslands);
  res.render('add-memory.ejs', { emotion: emotionValue, islands: userIslands })
})

app.post('/add-memory', requiresAuthentication, upload.array('image-input'), (request, response) => {
  if (!request.session.loggedInUser) {
    return response.redirect('/login');
  }

  let dateString = '';
  if (request.body['date-year'] && request.body['date-month'] && request.body['date-day']) {
    dateString = `${request.body['date-year']}/${request.body['date-month']}/${request.body['date-day']}`;
  }

  let imgSrc = [];
  if (request.files && request.files.length > 0) {
    imgSrc = request.files.map(file => `/uploads/${file.filename}`);
  }

  let islands = request.body.island || [];
  if (!Array.isArray(islands)) {
    islands = islands ? [islands] : [];
  }

  let singleMemory = {
    title: request.body.title || '',
    description: request.body.description || '',
    date: dateString,
    emotion: request.body.emotion || '',
    island: islands,
    username: request.session.loggedInUser,
    imgSrc: imgSrc,
  };

  let time = new Date();
  singleMemory.time = time.toLocaleTimeString();

  memories.push(singleMemory);
  memoriesdb.insert(singleMemory, (err, newData) => {
    if (err) {
      console.error('Error saving memory:', err);
      return response.redirect('/add-memory?error=save');
    }
    response.redirect("/home")
  })
});

app.get('/home', requiresAuthentication, (req, res) => {
  const username = req.session.loggedInUser;

  memoriesdb.find({ username: username }, (err, userMemories) => {
    if (err) {
      console.error('Error fetching memories:', err);
      return res.render('index.ejs', { memoryCount: 0, trainUnlocked: false, trainMemory: [] });
    }

    const memoryCount = userMemories ? userMemories.length : 0;
    const trainUnlocked = memoryCount >= 6;

    let trainMemory = [];
    if (userMemories && userMemories.length > 0) {
      const shuffled = [...userMemories].sort(() => 0.5 - Math.random());
      trainMemory = shuffled.slice(0, 6);
    }

    res.render('index.ejs', {
      memoryCount: memoryCount,
      trainUnlocked: trainUnlocked,
      trainMemory: trainMemory
    });
  });
})

app.get('/api/memory/:id', requiresAuthentication, (req, res) => {
  const memoryId = req.params.id;
  const username = req.session.loggedInUser;

  memoriesdb.findOne({ _id: memoryId, username: username }, (err, memory) => {
    if (err) {
      console.error('Error fetching memory:', err);
      return res.status(500).json({ error: 'Error fetching memory' });
    }

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json(memory);
  });
});

app.get('/profile', requiresAuthentication, (req, res) => {
  res.render('profile.ejs', {})
})

app.get('/train', requiresAuthentication, (req, res) => {
  res.render('train.ejs', {})
})

app.get('/all-memory', requiresAuthentication, (req, res) => {
  const username = req.session.loggedInUser;
  let islands = [];
  islandsdb.find({ username: username }, (err, userIslands) => {
    if (err) {
      console.error('Error fetching islands:', err);
      return res.render('all-memory.ejs', { memories: [], islands: [] });
    }
    islands = userIslands;
  });
  memoriesdb.find({ username: username }, (err, userMemories) => {
    if (err) {
      console.error('Error fetching memories:', err);
      return res.render('all-memory.ejs', { memories: [] });
    }

    res.render('all-memory.ejs', { memories: userMemories, islands: islands });
  });
});

// Manager page - password protected
const MANAGER_PASSWORD = process.env.MANAGER_PASSWORD;

function requiresManagerAuth(req, res, next) {
  if (req.session.managerAuthenticated) {
    next();
  } else {
    const password = req.query.password || req.body.password;
    if (password === MANAGER_PASSWORD) {
      req.session.managerAuthenticated = true;
      next();
    } else {
      res.render('manager-login.ejs', { error: req.query.password ? 'Incorrect password' : null });
    }
  }
}

app.get('/manager', (req, res) => {
  if (req.session.managerAuthenticated) {
    modelsdb.find({}, (err, models) => {
      if (err) {
        console.error('Error fetching models:', err);
        return res.render('manager.ejs', { models: [], error: 'Error loading models', success: null });
      }
      res.render('manager.ejs', { models: models || [], error: null, success: null });
    });
  } else {
    res.render('manager-login.ejs', { error: null });
  }
});

app.post('/manager/login', (req, res) => {
  const password = req.body.password;
  if (password === MANAGER_PASSWORD) {
    req.session.managerAuthenticated = true;
    res.redirect('/manager');
  } else {
    res.render('manager-login.ejs', { error: 'Incorrect password' });
  }
});

app.post('/manager/add-model', (req, res) => {
  if (!req.session.managerAuthenticated) {
    return res.redirect('/manager');
  }

  const { name, displayName, modelUrl, previewUrl } = req.body;

  if (!name || !displayName || !modelUrl || !previewUrl) {
    modelsdb.find({}, (err, models) => {
      return res.render('manager.ejs', {
        models: models || [],
        error: 'All fields are required',
        success: null
      });
    });
    return;
  }

  // Check if model with same name already exists
  modelsdb.findOne({ name: name.toUpperCase() }, (err, existing) => {
    if (err) {
      console.error('Error checking model:', err);
      modelsdb.find({}, (err, models) => {
        return res.render('manager.ejs', {
          models: models || [],
          error: 'Error checking model',
          success: null
        });
      });
      return;
    }

    if (existing) {
      modelsdb.find({}, (err, models) => {
        return res.render('manager.ejs', {
          models: models || [],
          error: 'Model with this name already exists',
          success: null
        });
      });
      return;
    }

    const newModel = {
      name: name.toUpperCase(),
      displayName: displayName,
      modelUrl: modelUrl,
      previewUrl: previewUrl
    };

    modelsdb.insert(newModel, (err, doc) => {
      if (err) {
        console.error('Error adding model:', err);
        modelsdb.find({}, (err, models) => {
          return res.render('manager.ejs', {
            models: models || [],
            error: 'Error adding model',
            success: null
          });
        });
      } else {
        modelsdb.find({}, (err, models) => {
          return res.render('manager.ejs', {
            models: models || [],
            error: null,
            success: 'Model added successfully!'
          });
        });
      }
    });
  });
});

app.post('/manager/delete-model', (req, res) => {
  if (!req.session.managerAuthenticated) {
    return res.redirect('/manager');
  }

  const modelId = req.body.modelId;
  if (!modelId) {
    return res.redirect('/manager');
  }

  modelsdb.remove({ _id: modelId }, {}, (err, numRemoved) => {
    if (err) {
      console.error('Error deleting model:', err);
    }
    res.redirect('/manager');
  });
});

app.get('/manager/logout', (req, res) => {
  delete req.session.managerAuthenticated;
  res.redirect('/manager');
});

app.listen(6002, () => {
  console.log("server started at http://localhost:6002");
});


function loadModelsFromFile() {
  const modelsFilePath = path.join(__dirname, 'database', 'models.txt')
  try {
    const fileContent = fs.readFileSync(modelsFilePath, 'utf8')
    const lines = fileContent.split('\n').filter(line => line.trim())

    lines.forEach(line => {
      try {
        const model = JSON.parse(line)
        if (!model.name) {
          console.warn('Skipping model without name:', line)
          return
        }

        modelsdb.findOne({ name: model.name }, (err, existing) => {
          if (err) {
            console.error(`Error checking model ${model.name}:`, err)
            return
          }

          if (!existing) {
            modelsdb.insert(model, (insertErr, doc) => {
              if (insertErr) {
                console.error(`Error inserting model from file ${model.name}:`, insertErr)
              } else {
                console.log(`Loaded model from file: ${model.name}`)
              }
            })
          } else {
            // console.log(`Model ${model.name} already exists in database`)
          }
        })
      } catch (parseErr) {
        console.error('Error parsing model line:', parseErr.message, line)
      }
    })
  } catch (fileErr) {
    console.error('Error reading models file:', fileErr)
  }
}

setTimeout(() => {
  // loadModelsFromFile()
}, 1000)
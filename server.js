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
const nodemailer = require('nodemailer')

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

app.get('/home', requiresAuthentication, async (req, res) => {
  const username = req.session.loggedInUser;

  try {
    const user = await userdb.findOneAsync({ username: username });
    
    memoriesdb.find({ username: username }, (err, userMemories) => {
      if (err) {
        console.error('Error fetching memories:', err);
        return res.render('index.ejs', { 
          memoryCount: 0, 
          trainUnlocked: false, 
          trainMemory: [],
          emotionWords: null
        });
      }

      const memoryCount = userMemories ? userMemories.length : 0;
      const trainUnlocked = memoryCount >= 6;

      let trainMemory = [];
      if (userMemories && userMemories.length > 0) {
        const shuffled = [...userMemories].sort(() => 0.5 - Math.random());
        trainMemory = shuffled.slice(0, 6);
      }

      // Get emotion words from user or use defaults
      const emotionWords = user && user.emotionWords ? user.emotionWords : {
        red: 'ANGER',
        yellow: 'JOY',
        green: 'DISGUST',
        blue: 'SADNESS',
        purple: 'FEAR'
      };

      res.render('index.ejs', {
        memoryCount: memoryCount,
        trainUnlocked: trainUnlocked,
        trainMemory: trainMemory,
        emotionWords: emotionWords
      });
    });
  } catch (err) {
    console.error('Error loading user:', err);
    memoriesdb.find({ username: username }, (err, userMemories) => {
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
        trainMemory: trainMemory,
        emotionWords: {
          red: 'ANGER',
          yellow: 'JOY',
          green: 'DISGUST',
          blue: 'SADNESS',
          purple: 'FEAR'
        }
      });
    });
  }
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

app.get('/memory-:id', requiresAuthentication, (req, res) => {
  const memoryId = req.params.id;
  const username = req.session.loggedInUser;

  memoriesdb.findOne({ _id: memoryId, username: username }, (err, memory) => {
    if (err) {
      console.error('Error fetching memory:', err);
      return res.redirect('/all-memory');
    }

    if (!memory) {
      return res.redirect('/all-memory');
    }

    // Get islands for this memory
    let islands = [];
    if (memory.island && memory.island.length > 0) {
      islandsdb.find({ _id: { $in: memory.island }, username: username }, (err, userIslands) => {
        if (err) {
          console.error('Error fetching islands:', err);
        } else {
          islands = userIslands || [];
        }
        res.render('individual-memory.ejs', { memory: memory, islands: islands });
      });
    } else {
      res.render('individual-memory.ejs', { memory: memory, islands: [] });
    }
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

// Islands management page
app.get('/all-islands', requiresAuthentication, async (req, res) => {
  const username = req.session.loggedInUser;
  
  try {
    const userIslands = await islandsdb.findAsync({ username: username });
    const userMemories = await memoriesdb.findAsync({ username: username });
    
    // Populate memories for each island
    const islandsWithMemories = await Promise.all(
      userIslands.map(async (island) => {
        const islandMemories = [];
        if (island.memories && island.memories.length > 0) {
          for (const memoryId of island.memories) {
            const memory = await memoriesdb.findOneAsync({ _id: memoryId });
            if (memory) {
              islandMemories.push(memory);
            }
          }
        }
        return {
          ...island,
          islandMemories: islandMemories
        };
      })
    );
    
    res.render('all-islands.ejs', {
      islands: islandsWithMemories,
      allMemories: userMemories
    });
  } catch (err) {
    console.error('Error loading islands:', err);
    res.render('all-islands.ejs', { islands: [], allMemories: [] });
  }
});

// Edit island page
app.get('/edit-island/:id', requiresAuthentication, async (req, res) => {
  const username = req.session.loggedInUser;
  const islandId = req.params.id;
  
  try {
    const island = await islandsdb.findOneAsync({ _id: islandId, username: username });
    
    if (!island) {
      return res.redirect('/all-islands');
    }
    
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

    res.render('edit-island.ejs', {
      island: island,
      memories: userMemories,
      models: allModels
    });

  } catch (err) {
    console.error('Error in /edit-island route:', err);
    res.redirect('/all-islands');
  }
});

// Update island
app.post('/edit-island/:id', requiresAuthentication, upload.none(), async (req, res) => {
  if (!req.session.loggedInUser) {
    return res.redirect('/login');
  }

  const username = req.session.loggedInUser;
  const islandId = req.params.id;

  try {
    const island = await islandsdb.findOneAsync({ _id: islandId, username: username });
    if (!island) {
      return res.redirect('/all-islands');
    }

    // Get old memory IDs
    const oldMemoryIds = island.memories || [];

    // Update island basic info
    const updatedIsland = {
      name: req.body.name || '',
      model: req.body.model || '',
      color: req.body.color || '1',
    };

    // Get new memory IDs
    let newMemoryIds = [];
    if (req.body.memories) {
      newMemoryIds = Array.isArray(req.body.memories)
        ? req.body.memories
        : [req.body.memories];
    }

    // Update island with new data
    await islandsdb.updateAsync(
      { _id: islandId },
      { $set: { ...updatedIsland, memories: newMemoryIds } }
    );

    // Remove island from memories that are no longer associated
    const removedMemoryIds = oldMemoryIds.filter(id => !newMemoryIds.includes(id));
    for (const memoryId of removedMemoryIds) {
      const memory = await memoriesdb.findOneAsync({ _id: memoryId });
      if (memory && memory.island) {
        const updatedIslands = memory.island.filter(id => id !== islandId);
        await memoriesdb.updateAsync(
          { _id: memoryId },
          { $set: { island: updatedIslands } }
        );
      }
    }

    // Add island to new memories
    const addedMemoryIds = newMemoryIds.filter(id => !oldMemoryIds.includes(id));
    for (const memoryId of addedMemoryIds) {
      const memory = await memoriesdb.findOneAsync({ _id: memoryId });
      if (memory) {
        const updatedIslands = [...(memory.island || []), islandId];
        await memoriesdb.updateAsync(
          { _id: memoryId },
          { $set: { island: updatedIslands } }
        );
      }
    }

    return res.redirect('/all-islands');

  } catch (err) {
    console.error("Error updating island:", err);
    res.redirect('/all-islands');
  }
});

// Update island name
app.post('/islands/update-name', requiresAuthentication, upload.none(), async (req, res) => {
  const { islandId, newName } = req.body;
  const username = req.session.loggedInUser;
  
  if (!islandId || !newName) {
    return res.status(400).json({ error: 'Island ID and name are required' });
  }
  
  try {
    const island = await islandsdb.findOneAsync({ _id: islandId, username: username });
    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }
    
    await islandsdb.updateAsync(
      { _id: islandId },
      { $set: { name: newName } }
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating island name:', err);
    res.status(500).json({ error: 'Error updating island name' });
  }
});

// Delete island
app.post('/islands/delete', requiresAuthentication, upload.none(), async (req, res) => {
  const { islandId } = req.body;
  const username = req.session.loggedInUser;
  
  if (!islandId) {
    return res.status(400).json({ error: 'Island ID is required' });
  }
  
  try {
    const island = await islandsdb.findOneAsync({ _id: islandId, username: username });
    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }
    
    // Remove island ID from all memories that reference it
    if (island.memories && island.memories.length > 0) {
      for (const memoryId of island.memories) {
        const memory = await memoriesdb.findOneAsync({ _id: memoryId });
        if (memory && memory.island) {
          const updatedIslands = memory.island.filter(id => id !== islandId);
          await memoriesdb.updateAsync(
            { _id: memoryId },
            { $set: { island: updatedIslands } }
          );
        }
      }
    }
    
    // Delete the island
    await islandsdb.removeAsync({ _id: islandId });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting island:', err);
    res.status(500).json({ error: 'Error deleting island' });
  }
});

// Add memory to island
app.post('/islands/add-memory', requiresAuthentication, upload.none(), async (req, res) => {
  const { islandId, memoryId } = req.body;
  const username = req.session.loggedInUser;
  
  if (!islandId || !memoryId) {
    return res.status(400).json({ error: 'Island ID and Memory ID are required' });
  }
  
  try {
    const island = await islandsdb.findOneAsync({ _id: islandId, username: username });
    const memory = await memoriesdb.findOneAsync({ _id: memoryId, username: username });
    
    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    // Add memory to island if not already present
    if (!island.memories) {
      island.memories = [];
    }
    if (!island.memories.includes(memoryId)) {
      island.memories.push(memoryId);
      await islandsdb.updateAsync(
        { _id: islandId },
        { $set: { memories: island.memories } }
      );
    }
    
    // Add island to memory if not already present
    if (!memory.island) {
      memory.island = [];
    }
    if (!memory.island.includes(islandId)) {
      memory.island.push(islandId);
      await memoriesdb.updateAsync(
        { _id: memoryId },
        { $set: { island: memory.island } }
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error adding memory to island:', err);
    res.status(500).json({ error: 'Error adding memory to island' });
  }
});

// Remove memory from island
app.post('/islands/remove-memory', requiresAuthentication, upload.none(), async (req, res) => {
  const { islandId, memoryId } = req.body;
  const username = req.session.loggedInUser;
  
  if (!islandId || !memoryId) {
    return res.status(400).json({ error: 'Island ID and Memory ID are required' });
  }
  
  try {
    const island = await islandsdb.findOneAsync({ _id: islandId, username: username });
    const memory = await memoriesdb.findOneAsync({ _id: memoryId, username: username });
    
    if (!island) {
      return res.status(404).json({ error: 'Island not found' });
    }
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    // Remove memory from island
    if (island.memories) {
      const updatedMemories = island.memories.filter(id => id !== memoryId);
      await islandsdb.updateAsync(
        { _id: islandId },
        { $set: { memories: updatedMemories } }
      );
    }
    
    // Remove island from memory
    if (memory.island) {
      const updatedIslands = memory.island.filter(id => id !== islandId);
      await memoriesdb.updateAsync(
        { _id: memoryId },
        { $set: { island: updatedIslands } }
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error removing memory from island:', err);
    res.status(500).json({ error: 'Error removing memory from island' });
  }
});

// Settings page
app.get('/settings', requiresAuthentication, async (req, res) => {
  const username = req.session.loggedInUser;
  
  try {
    const user = await userdb.findOneAsync({ username: username });
    const userIslands = await islandsdb.findAsync({ username: username });
    const userMemories = await memoriesdb.findAsync({ username: username });

    const islandCount = userIslands ? userIslands.length : 0;
    const maxIslands = 20; // MAX_INNER (8) + MAX_OUTER (12)
    const memoryCount = userMemories ? userMemories.length : 0;
    const maxMemories = 500;
    
    res.render('settings.ejs', {
      user: user,
      islandCount: islandCount,
      maxIslands: maxIslands,
      memoryCount: memoryCount,
      maxMemories: maxMemories,
      usernameError: null,
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  } catch (err) {
    console.error('Error loading settings:', err);
    res.render('settings.ejs', {
      user: null,
      islandCount: 0,
      maxIslands: 20,
      memoryCount: 0,
      maxMemories: 500,
      usernameError: null,
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  }
});

// Change username
app.post('/settings/change-username', requiresAuthentication, upload.none(), async (req, res) => {
  const username = req.session.loggedInUser;
  const { newUsername } = req.body;

  if (!newUsername || newUsername.trim() === '') {
    const user = await userdb.findOneAsync({ username: username });
    return res.render('settings.ejs', {
      user: user,
      usernameError: 'Username cannot be empty',
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  }

  try {
    // Check if new username already exists
    const existingUser = await userdb.findOneAsync({ username: newUsername });
    if (existingUser && existingUser.username !== username) {
      const user = await userdb.findOneAsync({ username: username });
      return res.render('settings.ejs', {
        user: user,
        usernameError: 'Username already exists',
        usernameSuccess: null,
        passwordError: null,
        passwordSuccess: null,
        wordsError: null,
        wordsSuccess: null
      });
    }

    // Update username
    await userdb.updateAsync(
      { username: username },
      { $set: { username: newUsername } }
    );

    // Update session
    req.session.loggedInUser = newUsername;

    // Update all references to the old username in islands and memories
    await islandsdb.updateAsync(
      { username: username },
      { $set: { username: newUsername } },
      { multi: true }
    );

    await memoriesdb.updateAsync(
      { username: username },
      { $set: { username: newUsername } },
      { multi: true }
    );

    const user = await userdb.findOneAsync({ username: newUsername });
    res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: 'Username updated successfully',
      passwordError: null,
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  } catch (err) {
    console.error('Error updating username:', err);
    const user = await userdb.findOneAsync({ username: username });
    res.render('settings.ejs', {
      user: user,
      usernameError: 'Error updating username',
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  }
});

// Change password
app.post('/settings/change-password', requiresAuthentication, upload.none(), async (req, res) => {
  const username = req.session.loggedInUser;
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    const user = await userdb.findOneAsync({ username: username });
    return res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: null,
      passwordError: 'All password fields are required',
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  }

  if (newPassword !== confirmPassword) {
    const user = await userdb.findOneAsync({ username: username });
    return res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: null,
      passwordError: 'New password and confirm password do not match',
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  }

  try {
    const user = await userdb.findOneAsync({ username: username });
    if (!user) {
      return res.render('settings.ejs', {
        user: null,
        usernameError: null,
        usernameSuccess: null,
        passwordError: 'User not found',
        passwordSuccess: null,
        wordsError: null,
        wordsSuccess: null
      });
    }

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.render('settings.ejs', {
        user: user,
        usernameError: null,
        usernameSuccess: null,
        passwordError: 'Current password is incorrect',
        passwordSuccess: null,
        wordsError: null,
        wordsSuccess: null
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await userdb.updateAsync(
      { username: username },
      { $set: { password: hashedPassword } }
    );

    res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: 'Password updated successfully',
      wordsError: null,
      wordsSuccess: null
    });
  } catch (err) {
    console.error('Error updating password:', err);
    const user = await userdb.findOneAsync({ username: username });
    res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: null,
      passwordError: 'Error updating password',
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: null
    });
  }
});

// Change words - split words into two parts
// Odd length: split in half and delete middle character (e.g., "disgust" 7 chars -> "dis" and "ust", removing "g")
// Even length: split directly in half (e.g., "this" 4 chars -> "th" and "is")
function splitWord(word) {
  if (!word || word.length === 0) return { part1: '', part2: '' };
  const upperWord = word.toUpperCase();
  const length = word.length;
  
  if (length <= 2) return { part1: upperWord, part2: '' };
  
  if (length % 2 === 0) {
    // Even length: split directly in half
    const half = length / 2;
    return {
      part1: upperWord.substring(0, half),
      part2: upperWord.substring(half)
    };
  } else {
    // Odd length: take first half, skip middle, take last half
    const half = Math.floor(length / 2);
    return {
      part1: upperWord.substring(0, half),
      part2: upperWord.substring(half + 1) // Skip middle character
    };
  }
}

// Change words
app.post('/settings/change-words', requiresAuthentication, upload.none(), async (req, res) => {
  const username = req.session.loggedInUser;
  const { wordRed, wordYellow, wordGreen, wordBlue, wordPurple } = req.body;

  try {
    // Store the full words and their split versions
    const emotionWords = {
      red: wordRed || 'ANGER',
      yellow: wordYellow || 'JOY',
      green: wordGreen || 'DISGUST',
      blue: wordBlue || 'SADNESS',
      purple: wordPurple || 'FEAR'
    };

    const emotionWordParts = {
      red: splitWord(wordRed || 'ANGER'),
      yellow: splitWord(wordYellow || 'JOY'),
      green: splitWord(wordGreen || 'DISGUST'),
      blue: splitWord(wordBlue || 'SADNESS'),
      purple: splitWord(wordPurple || 'FEAR')
    };

    // Update emotion words
    await userdb.updateAsync(
      { username: username },
      { 
        $set: { 
          emotionWords: emotionWords,
          emotionWordParts: emotionWordParts
        } 
      }
    );

    const user = await userdb.findOneAsync({ username: username });
    res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: null,
      wordsError: null,
      wordsSuccess: 'Words updated successfully'
    });
  } catch (err) {
    console.error('Error updating words:', err);
    const user = await userdb.findOneAsync({ username: username });
    res.render('settings.ejs', {
      user: user,
      usernameError: null,
      usernameSuccess: null,
      passwordError: null,
      passwordSuccess: null,
      wordsError: 'Error updating words',
      wordsSuccess: null
    });
  }
});

// Feedback page
app.get('/feedback', requiresAuthentication, (req, res) => {
  res.render('feedback.ejs', {
    error: null,
    success: null,
    contactEmail: process.env.CONTACT_EMAIL || 'carol@example.com'
  });
});

// Submit feedback
app.post('/feedback/submit', requiresAuthentication, upload.none(), async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.render('feedback.ejs', {
      error: 'All fields are required',
      success: null
    });
  }

  // Email configuration - using Gmail SMTP
  // Set these in your .env file:
  // FEEDBACK_EMAIL=your-email@gmail.com
  // FEEDBACK_EMAIL_PASSWORD=your-app-password
  const feedbackEmail = process.env.FEEDBACK_EMAIL || 'your-email@gmail.com';
  const feedbackEmailPassword = process.env.FEEDBACK_EMAIL_PASSWORD || 'your-app-password';

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: feedbackEmail,
        pass: feedbackEmailPassword
      }
    });

    // Email content
    const mailOptions = {
      from: feedbackEmail,
      to: feedbackEmail,
      replyTo: email,
      subject: `Feedback from ${name} - Palette U`,
      html: `
        <h2>New Feedback Submission</h2>
        <p><strong>From:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>You can reply directly to this email to respond to ${name}.</em></p>
      `,
      text: `
New Feedback Submission

From: ${name}
Email: ${email}

Message:
${message}

---
You can reply directly to this email to respond to ${name}.
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.render('feedback.ejs', {
      error: null,
      success: 'Thank you for your feedback! I\'ll get back to you soon.',
      contactEmail: process.env.CONTACT_EMAIL || 'carol@example.com'
    });
  } catch (err) {
    console.error('Error sending feedback email:', err);
    res.render('feedback.ejs', {
      error: 'Sorry, there was an error sending your feedback. Please try again later.',
      success: null,
      contactEmail: process.env.CONTACT_EMAIL || 'carol@example.com'
    });
  }
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
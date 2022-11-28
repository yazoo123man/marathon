const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
var on = true;
var today1 = new Date();
var start = ""

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(session({
  secret: "our little secret.",
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect('mongodb://127.0.0.1/marathon22', {
  useNewUrlParser: true
}, (err) => {
  if (!err) console.log("dbconnected");
  else console.log("dbfuckedup");
})
// this is userSchema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);

//for starting time
const timeSchema = new mongoose.Schema({
  id: Number,
  minute: Number,
  second: Number
})
const Time = mongoose.model("Time", timeSchema)
//for check point
const checkSchema = new mongoose.Schema({
  Point: {
    type: String
  },
  time: Number,
  second: Number
})
const Check = mongoose.model("Check", checkSchema)
//for the information schema
const infoSchema = new mongoose.Schema({
  gender: String,
  catagory: String,
  name: String,
  age: {
    type: Number,
    max: 80,
    min: 8
  },
  number: Number,
  time: Number,
  second: Number,
  checkpoints: [checkSchema],
  position: Number,
  catagoryPosition: Number
})

const Info = mongoose.model("Info", infoSchema);
//this the current home page for registration
app.get("/", function(req, res) {
  res.render("home.ejs", {
    msg: ""
  });
})

app.post("/", function(req, res) {
  const name = req.body.Name;
  const age = req.body.age;
  const sex = req.body.sex;
  const catagory = req.body.catagory;
  const number = req.body.Number;
  Info.findOne({
    number: number
  }, function(err, theOne) {
    var succcess = ""
    if (theOne == null) {
      console.log("this is good");

      const info = new Info({
        name: name,
        age: age,
        number: number,
        gender: sex,
        catagory: catagory
      })
      succcess = "Success"
      info.save(function(err) {
        if (err) {
          console.log("There was an error");
        }
      });
      res.render("home", {
        msg: succcess
      })
    } else {
      console.log("this is bad");
      succcess = "this shit exits";
      console.log(succcess);
      res.render("home", {
        msg: succcess
      })
    }

  })
})
//this is to add checkpoint by the admin
app.get("/addpoint", function(req, res) {
  res.render("addpoint.ejs")
});
app.post("/addpoint", function(req, res) {
  Check.findOne({
    Point: req.body.point
  }, function(err, one) {
    if (one == null) {
      console.log("this is good");
      const look = new Check({
        Point: req.body.point
      })
      look.save(function(err) {
        if (err) {
          console.log("there was an error");
          res.redirect("/addpoint")
        }
      })
    } else {
      console.log("this is bad");
    }
    res.redirect("/addpoint")
  })

})

// this is for chose checkpoint for update
app.get("/chose", function(req, res) {
  Check.find(function(err, array) {
    if (!err) {
      res.render("update.ejs", {
        array: array
      })
    }
  })
})

app.post("/chose", function(req, res) {
  const chose = req.body.checkpoints;
  console.log(chose);
  res.redirect("/chose/" + chose)
})
//this is to set and store the global time
app.get("/settime", function(req, res) {
  res.render("start.ejs", {
    message: ""
  })
})

app.post("/settime", function(req, res) {
  const check = req.body.value
  if (check === "Start") {
    if (on) {
      Time.findOne({
        id: 1
      }, function(err, look) {
        if (look == null) {
          const time = new Time({
            id: 1,
            minute: today1.getHours() * 60 + today1.getMinutes(),
            second: today1.getSeconds()
          })
          time.save()
          on = false
        } else {
          look.minute = today1.getHours() * 60 + today1.getMinutes()
          look.second = today1.getSeconds()
          look.save()
          on = false
        }
      })
      res.redirect("/settime")
    } else {
      res.render("start", {
        message: "Error!! The ongoing marathon time is runnig Please reset to Start"
      })
    }

  } else {
    on = true
    res.render("start", {
      message: "You can now click on start"
    })
  }

})
//this is to add time to the checkpoint
app.get("/chose/:topic", function(req, res) {
  res.render("checkpoint.ejs", {
    message: "",
    checkpoint: req.params.topic
  })
})

app.post("/chose/:topic", function(req, res) {
  const number = req.body.number
  const today = new Date();
  var time = 0
  var second = 0
  Time.findOne({
    id: 1
  }, function(err, look) {
    if (look == null) {
      res.render("checkpoint", {
        message: "Error!!! Marathon time is not set",
        checkpoint: req.params.topic
      })
    } else {
      time = time + (today.getHours() * 60 + today.getMinutes()) - look.minute //this is for the time need to change later
      second = 0 + today.getSeconds()
      manKind()
    }
  })

  function manKind() {
    if (req.params.topic != "Finish") {
      const new1 = new Check({
        Point: req.params.topic,
        time: time,
        second: second
      })
      Info.findOne({
        number: number
      }, function(err, look) {
        if (err) {
          console.log("there was an error");
        } else if (look == null) {
          res.render("checkpoint.ejs", {
            message: "Number doesn't exits",
            checkpoint: req.params.topic
          })
        } else {

          const man = look.checkpoints.find(o => o.Point === req.params.topic)
          if (man == null) {
            look.checkpoints.push(new1)
            look.save()
            res.redirect("/chose/" + req.params.topic)
          } else {
            res.render("checkpoint", {
              message: "Given player's record is already updated",
              checkpoint: req.params.topic
            })
          }
        }
      })
    } else { //this else is for the final checkpoint
      Info.findOne({
        number: number
      }, function(err, look) {
        if (err) {
          console.log("there was an error");
        } else if (look == null) {
          res.render("checkpoint.ejs", {
            message: "Number doesn't exits",
            checkpoint: req.params.topic
          })
        } else {
          if (look.time == null) {
            look.time = time
            look.second = second
            look.save()
            res.redirect("/chose/" + req.params.topic)
          } else {
            res.render("checkpoint", {
              message: "Given players race is complete",
              checkpoint: req.params.topic
            })
          }
        }
      })
    }
  }
})


//this is to view the results
app.get("/views", function(req, res) {
  Info.find({}).sort({
    time: 1,
    second: 1
  }).exec((err, docs) => {
    var pos = 1,
      mpos = 1,
      wpos = 1,
      smpos = 1,
      swpos = 1,
      jpos = 1,
      spos = 1,
      dpos = 1;
    docs.forEach(function(element) {
      if (element.time != null) {

        element.position = pos
        pos++
        switch (element.catagory) {
          case "Mens":
            element.catagoryPosition = mpos;
            mpos++;
            break;
          case "Women":
            element.catagoryPosition = wpos;
            wpos++;
            break;
          case "Junior":
            element.catagoryPosition = jpos;
            jpos++;
            break;
          case "Senior":
            element.catagoryPosition = spos;
            spos++;
            break;
          case "Disable":
            element.catagoryPosition = dpos;
            dpos++;
            break;
          case "Staffmen":
            element.catagoryPosition = smpos;
            smpos++;
            break;
          case "Staffwomen":
            element.catagoryPosition = swpos;
            swpos++;
            break;
          default:
            console.log("This is default");
        }
        element.save()
      }

    })
    res.render("views", {
      message: "",
      array: docs
    })
  });
})

app.post("/views", function(req, res) {
  const one = req.body.search;
  const catagory= req.body.catagory;
  if (one === "one") {
    const number = req.body.Number
    Info.findOne({
      number: number
    }, function(err, look) {
      if (err) {
        console.log("there was an error");
      } else if (look == null) {
        Info.find({}).sort({
          time: 1,
          second: 1
        }).exec((err, docs) => {
          res.render("views", {
            message: "Number doesn't Exists",
            array: docs
          })
        });
      } else {
        res.render("views", {
          message: "",
          array: [look]
        })
      }
    })
  }
  if(one==="two")
  {
    Info.find({catagory: catagory}, function(err, array)
  {
    res.render("views", {
      message: "",
      array: array
    })
  })
  }
})

app.get("/detail", function(req, res){
  Info.find(function(err, array){
      res.render("detail", {array: array})
  })

})
app.listen(3000, function() {
  console.log("server has started");
})

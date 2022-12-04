const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require("passport")
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
var on = false;
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
mongoose.connect('mongodb+srv://sxc20221217:This2001212isP%40ssowrd@cluster0.4qmjqug.mongodb.net/?retryWrites=true&w=majority/marathon', {
  useNewUrlParser: true
}, (err) => {
  if (!err) console.log("dbconnected");
  else console.log("dbfuckedup");
})
// this is userSchema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  admin: String,
  point: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
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
//this is for registration
app.get("/adminregister", function(req, res) {
  // res.render("register");
    if (req.isAuthenticated()) {
      if (req.user.admin === "yes") {
         {
          res.render("register");
        }
      } else {
          res.render("privilege");
      }
    } else {
      res.render("login", {
        msg: "The user is not registered"
      });
    }
})
app.post("/adminregister", function(req, res) {
  User.register({
    username: req.body.username,
    admin: req.body.admin
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      })
    }
  })
})
// this is for login
app.get("/login", function(req, res) {
  res.render("login", {
    msg: ""
  });
})

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/");
      })
    }
  })
})
//this the current home page for registration
app.get("/", function(req, res){
  res.render("realhome.ejs");
})
app.get("/register", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.admin === "yes") {
       {
        res.render("home.ejs", {
          msg: ""
        });
      }
    } else {
      res.render("privilege");
    }
  } else {
    res.render("login", {
      msg: "The user is not registered"
    });
  }

})

app.post("/register", function(req, res) {
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
      succcess = "This number exists";
      res.render("home", {
        msg: succcess
      })
    }

  })
})
//this is to add checkpoint by the admin
app.get("/addpoint", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.admin === "yes") {
      {
        res.render("addpoint.ejs");
      }
    } else {
      res.render("privilege");
    }
  } else {
    res.render("login", {
      msg: "The user is not registered"
    });
  }


});
app.post("/addpoint", function(req, res) {
  Check.findOne({
    Point: req.body.point
  }, function(err, one) {
    if (one == null) {
      const look = new Check({
        Point: req.body.point
      })
      look.save(function(err) {
        if (err) {
          console.log(err);
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
  if (req.isAuthenticated()) {
    if (req.user.admin === "yes") {

      Check.find(function(err, array) {
        if (!err) {
          User.find(function(err, userArray) {
            if (!err) {
              res.render("update.ejs", {
                array: array,
                userArray: userArray
              })
            }
          })

        }
      })
    } else {
      res.redirect("/chose/" + req.user._id);
    }
  } else {
    res.render("login", {
      msg: "The user is not registered"
    });
  }

})

app.post("/chose", function(req, res) {
  const chose = req.body.checkpoints;
  const nameUser = req.body.users;
  User.findOne({
    username: nameUser
  }, function(err, look) {
    look.point = chose;
    look.save();
    res.redirect("/chose");
  })
})
//this is to set and store the global time
app.get("/settime", function(req, res) {
  if (req.isAuthenticated()) {
    if (req.user.admin === "yes") {
      {
        res.render("start.ejs", {
          message: ""
        })
      }
    } else {
      res.render("privilege");
    }
  } else {
    res.render("login", {
      msg: "The user is not registered"
    });
  }

})

app.post("/settime", function(req, res) {
  var today1 = new Date();
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
  if (req.isAuthenticated()) {
    res.render("checkpoint.ejs", {
      message: "",
      checkpoint: req.user.point
    })

  }
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
        checkpoint: req.user.point
      })
    } else {
      if(today.getSeconds()>look.second)
      {
          second = 0 + today.getSeconds()-look.second
      }
      else {
        second = 0 + look.second-today.getSeconds()
      }
      time = time + (today.getHours() * 60 + today.getMinutes()) - look.minute //this is for the time need to change later

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
            res.redirect("/chose/" + req.user._id)
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
      mpos = 1,//above 30
      wpos = 1,
      bmpos = 1,//below 30
      bwpos = 1,
      jpos = 1,
      spos = 1,
      dpos = 1;
      propos=1;
      staf=1;
    docs.forEach(function(element) {
      if (element.time != null) {

        element.position = pos
        pos++
        switch (element.catagory) {
          case "Mens+":
            element.catagoryPosition = mpos;
            mpos++;
            break;
          case "Women+":
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
          case "Mens":
            element.catagoryPosition = bmpos;
            bmpos++;
            break;
          case "Women":
            element.catagoryPosition = bwpos;
            bwpos++;
            break;
            case "Pro":
            element.catagoryPosition=propos;
            propos++;
            break;
          case "Staff":
            element.catagoryPosition=staf;
            staf++;
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
  const catagory = req.body.catagory;
  if (one === "one") {
    const number = req.body.Number
    Info.findOne({
      number: number
    }, function(err, look) {
      if (err) {
        console.log("there was an error");
      } else if (look == null) {
        res.render("views", {
          message: "Number doesn't Exists",
          array: []
        })
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
  if (one === "two") {
    Info.find({
      catagory: catagory
    }).sort({
      time: 1,
      second: 1
    }).exec((err, docs) => {
      res.render("views", {
        message: "",
        array: docs
      })
    })
  }
})
app.get("/delete", function(req, res){
  if (req.isAuthenticated()) {
    if (req.user.admin === "yes") {

      Check.find(function(err, array) {
        if (!err) {
          User.find(function(err, userArray) {
            if (!err) {
              res.render("delect.ejs")
            }
          })

        }
      })
    } else {
      res.render("privilege");
    }
  } else {
    res.render("login", {
      msg: "The user is not registered"
    });
  }
})

app.post("/delete", function(req, res){
  const number=req.body.delnumber;
  Info.findOneAndDelete({number: number}, function(err, one)
{
  if(!err)
  {
    console.log(one);
  }
}) // executes
res.redirect("/delete")

})
app.get("/logout", function(req, res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
})
// app.get("/detail", function(req, res) {
//
//   Info.find(function(err, array) {
//     res.render("detail", {
//       array: array
//     })
//   })
//
// })

app.get("/detail/:topic", function(req, res){
  Info.findById(req.params.topic, function(err, array) {
    if(err)
    {
      res.redirect("/views");
    }
    else if(array==null)
    {
      res.redirect("/views");
    }
    else{

    res.render("detail", {
      array: [array],
      array2: array.checkpoints
    })}
  })
})
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started sucessfully");
});

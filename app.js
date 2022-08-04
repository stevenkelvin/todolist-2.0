const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { render } = require("ejs");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://stevenkelvin:Ilovechc1314@cluster0.58gmtga.mongodb.net/todolistDB");

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const listScheme = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listScheme);

const item1 = new Item({
  name: "Welcome to your todolist."
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete a item."
});

const defaultItems = [item1, item2, item3];

const day = date.getDate();

app.get("/", function(req, res) {
  
  Item.find({}, function (err, docs) {
    if(docs.length === 0){
      Item.insertMany(defaultItems, function (err) {
        if(err){
          console.log(err);
        } else {
          console.log("Successfully inserted items to database.");
        }
      });
      res.redirect("/");
    } else{
      res.render("list", {listTitle: day, newListItems: docs});
    }
  });
});

app.post("/", function(req, res){

  const itemName  = req.body.newItem;
  const listName = req.body.list;
  
  const item = new Item({
    name: itemName
  });

  if(listName == day){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
  });
}
});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  let convertedCheckedItemId = "";
  
  for(let i = 0; i < checkedItemId.length - 1; i++){
    convertedCheckedItemId += checkedItemId[i];
  }

  if(listName == day){
    Item.findByIdAndDelete(convertedCheckedItemId, function (err) {
      if(err){
        console.log(err);
      }
    });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: convertedCheckedItemId}}}, function (err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }
});

app.get("/:customListName", function (req, res) {
  let customListName = req.params.customListName.toLowerCase();
  customListName = customListName[0].toUpperCase() + customListName.slice(1);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(customListName != "About"){
        if(!foundList){
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        }else{
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }
      }
      else{
        res.render("about");
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully.");
});

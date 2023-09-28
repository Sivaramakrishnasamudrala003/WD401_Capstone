const express = require("express");
const math=require("mathjs");
const passwordHash=require("password-hash");
var bodyParser = require('body-parser');
const app = express();
const port = 4001;
app.use(bodyParser.urlencoded({ extended: true }))

app.use(bodyParser.json())

const { initializeApp , cert } = require("firebase-admin/app");
const { getFirestore, body, where } = require("firebase-admin/firestore");
var serviceAccount = require("./key.json");
initializeApp({
credential: cert(serviceAccount),
});

const db = getFirestore();
 
app.set("view engine","ejs");
//app.use(express.static('public'));

app.get("/",(req,res)=>{
res.render("intro");
});

app.get("/signup",(req,res)=>{
res.render("signup");
});
app.post("/signupsubmit", (req, res) => {
    const email = req.body.email;
const name= req.body.name;
const password=req.body.pwd;

    // Check if the email already exists in the database
    db.collection("Customers")
   .where("Email", "==", email)
   .get()
   .then((emailDocs) => {
      db.collection("Customers")
         .where("Name", "==", name)
         .get()
         .then((nameDocs) => {
            if (emailDocs.size > 0 || nameDocs.size > 0) {
               // Email or name already exists, send a message
               res.send("Hey, this email or name is already registered.");
            } else {
               // Email and name don't exist, add the data to the database
               db.collection("Customers")
                  .add({
                     name: req.body.name,
                     email: req.body.email,
                     Password: passwordHash.generate(password),
                  })
                  .then(() => {
                     res.render("login");
                  });
            }
         });
   })
   .catch((error) => {
console.error("Error checking email in Firestore:", error);
});

});

app.get("/login",(req,res)=>{
res.render("login");
});
/*app.get("/loginsubmit",(req,res)=>{
try{
    const email=req.body.email;
    //passwordHash.verify(req.body.pwd,hashedPassword)


const userdocs=db.collection("Customers").where("email","==",email).get()
console.log(userdocs.doc[0].data())

if(userdocs.empty){
res.render("signup")
}
else{
const userdata=userdocs.doc[0].data()
if(passwordHash.verify(req.body.pwd,userdata.Password))
{
res.render("home")
}
else{
res.render("signup")
}
}
   }
   catch(error){
console.log(error)
   }
});*/
app.post("/loginsubmit", (req, res) => {
const email = req.body.email;
 
// Check if the email address exists in the database.
db.collection("Customers")
 .where("email", "==", email)
 .get()
 .then((docs) => {
if (docs.empty) {
 // The email address does not exist in the database.
 res.render("signup");
 return;
}
 
// Iterate over the results of the body and check each document for a matching password.
let verified = false;
docs.forEach((doc) => {
  verified = passwordHash.verify(req.body.pwd, doc.data().Password);
});
 
if (verified) {
 res.render("home");
} else {
 res.render("signup");
}
 });
  });


app.get("/home",(req,res)=>{
res.render("home");
});

const arr=[];
const costs=[];
var amount=0;
app.get("/addedToCart",(req,res)=>{
const val=req.query.item;
var c=req.query.cost;
costs.push(c);
c=math.evaluate(c.slice(0,c.length-2));
amount=amount+c;
arr.push(val);
res.render("home");
});

app.get("/cart",(req,res)=>{
if(typeof(arr) != "undefined"){
db.collection("Cart").add({
Cart : arr,
Costs : costs,
TotalCost : amount,
}).then(()=>{
res.render("cart",{booksData : arr, amount : amount, costs : costs});
});
}
});
app.listen(port,()=>{
console.log(`You are in port number ${port}`);
});

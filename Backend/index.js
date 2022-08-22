const express  = require('express');
const cors = require('cors');

const Jwt = require ("jsonwebtoken");
const jwtkey = 'e-comm'

require('./DB/config')
const app = express();
const User = require('./DB/User');
const Product = require('./DB/Product')
app.use(express.json());
app.use(cors());

app.post("/Sign", async(req,resp)=>{
    let user = new User (req.body);
    let result = await user.save();
    result =  result.toObject();
    delete result.password
        Jwt.sign({result},jwtkey,{expiresIn:"2h"},(err,token)=>{
            if(err){
                resp.send({result: "something went wrong , please after sometime"})
            }
            resp.send({result, auth:token})
        });
});

app.post('/login', async (req,resp)=>{
    console.log(req.body)
    if (req.body.password && req.body.email){
        let user = await User.findOne(req.body).select("-password");
        if (user){
            Jwt.sign({user},jwtkey,{expiresIn:"2h"},(err,token)=>{
                if(err){
                    resp.send({result: "something went wrong , please after sometime"})
                }
                resp.send({user,auth:token})
            })
           
        }
        else{
            resp.send({result : "No User Found"})
        }
    }
    else{
        resp.send({result : "No User Found"})
    }
});

app.post("/add-product",verifytoken, async (req,resp)=>{
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
})

 app.get("/products",verifytoken, async ( req,resp)=>{
    let products = await Product.find();
    if (products.length>0){
        resp.send(products)
    }
    else{
        resp.send({result:"no products found"})
    }
 })

 app.delete('/product/:id',verifytoken, async (req,resp)=>{
    const result = await Product.deleteOne({_id:req.params.id})
    resp.send(result);
    
 })

 app.get("/product/:id",verifytoken, async (req,resp)=>{
    let result = await Product.findOne({_id:req.params.id});
    if(result){
        resp.send(result)
    }else{
        resp.send({result:"no record found"})
    }
 });

 app.put("/product/:id",verifytoken, async (req,resp)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {
            $set:req.body
        }
    )
    resp.send(result)
 })

 app.get('/search/:key', verifytoken,async (req,resp)=>{
     let result = await Product.find({
         "$or":[
             {name : {$regex:req.params.key}},
             {category : {$regex:req.params.key}},
             {company : {$regex:req.params.key}},
         ]
     });
     resp.send(result)
 });

 function verifytoken (req,resp,next){
     let token = req.headers['authorization'];
     if(token){
         token = token.split(' ')[1];
         console.log("middleware called if ", token)
         Jwt.verify(token, jwtkey,(err,valid)=>{
             if(err){
                 resp.send({result:"please provide valid token"})
             }
             else{
                 next();
             }
         })
     }
     else{
        resp.send({result:"please add token with headers"})
     }
 }

app.listen(5000);
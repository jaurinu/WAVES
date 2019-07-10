const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const SALT_I = 10;
require('dotenv').config();


const userSchema = mongoose.Schema({
    email:{
        type:String,
        required: true,
        trim: true,
        unique: 1
    },
    password:{
        type:String,
        required: true,
        minlength: 5
    },
    name:{
        type:String,
        required: true,
        maxlength:100
    },
    lastname:{
        type:String,
        required: true,
        maxlength:100
    },
    cart:{
        type:Array,
        default:[]
    },
    history:{
        type:Array,
        default:[]
    },
    role:{
        type:Number,
        default:0
    },
    token:{
        type:String
    }
});

//ESCMA 5
// userSchema.pre('save',function(next){
//     var user = this;

//     if(user.isModified('password')){
//         bcrypt.genSalt(SALT_I,function(err,salt){
//             if(err) return next(err);

//             bcrypt.hash(user.password,salt,function(err,hash){
//                 if(err) return next(err);
//                 user.password = hash;
//                 next();
//             });
//         })
//     }else{
//         next();
//     }
// })





//usamos el userSchema con el metodo pre que especifica una accion que se debe
//realizar antes de otra accion. En este caso el primer parametro es la accion que 
//se ejecutara despues de pre: ('save') antes de salvar el usuario vamos a realizar una
//funcion, (se especifica como segundo parametro) que a su vez tiene el parametro (next)
//Next es la accion que sigue despues del pre, es decir .save
//para encriptar el password traemos el modulo bcrypt y generamos un salt con .genSalt method
//le pasamos el numero guardado en la constante SALT_I, despues de generar el salt
//realizamos la siguiente funcion que es generar el hash, para ello necesitamos el password
//como primer parametro y el salt como segundo parametro una vez creado el hash
//lo guardamos como el password y vamos a la siguiente accion que es next: save
//de existir un error next sera (err)
//Generamos el hash solo en el caso que registremos un password o lo modifiquemos
//para eso utilizamos el statement if y el metodo this.isModified. this se refiere al userSchema
    userSchema.pre('save', async function (next){
    if(this.isModified('password')){
        try{
            const salt = await bcrypt.genSalt(SALT_I)
            const hash = await bcrypt.hash(this.password, salt)
            this.password = hash;
            next();
        }catch(err){
            return next(err);
        }
    }
})

//podemos crear metodos con mogodb y usarlos dentro del schema en una peticion
//al servidor.
//comparePassword sera una funcion que recibe dos distintos argumentos: el password
//del candidato y una funcion callback
//cuando haya terminado de comparar los passwords correra la cb, que se ejecutara y 
//el resutado se enviara a la funcion login
//bcrypt tiene un metodo .compare para checar los passwords recibe tres argumentos
//el password del candidato, el password del usuario de la bd y una funcion cb que 
//contendra un error o la respuesta de isMatch
userSchema.methods.comparePassword = function(candidatePassword,cb){
    bcrypt.compare(candidatePassword,this.password,function(err,isMatch){
        if(err) return cb(err);
        cb(null,isMatch)
    })
}

//para generar token importamos la dependencia jwt jsonwebtoken
//se crea una variable token, traemos la libreriq jwt y el metodo sign.
//Para crear el token se necesita un dato del usuario, en este caso el user.__id
//y un password secreto que se guardara como variable de entorno.
//el user._id lo debemos pasar a un hexString (cadena hexadecimal)
//entramos al usuario y guardamos el token user.token
//despues sobrescribimos dentro del usuario con el metodo .save los mismos datos del
//usuario mas el token generado. Si hay un error retornamos el callback con el error, 
//sino retornamos el callback con un error nulo y el user

userSchema.methods.generateToken = function(cb){
    var user = this;
    var token = jwt.sign(user._id.toHexString(),process.env.SECRET)

    user.token = token;
    user.save(function(err,user){
        if(err) return cb(err);
        cb(null,user);
    })
}

//usamos el modelo y creamos la funcion findByToken que recibira un token y un cb
//la libreria jsonwebtoken tiene un el metodo verify que recibe el token y el 
//password secreto que usamos para encriptar, con estos datos pasara a la siguiente
//funcion que tiene un error y decifrado. Lo que obtenemos al decifrar es el id del
//usuario; si obtenemos un user id significa que el token es valido, con esta 
//informacion pasamos a la siguiente funcion que encuentra un usuario
//a traves del metodo findOne. Si encuentra un usuario que corresponda al id decifrado
//con el token recibido la respuesta del callback con null como error y los datos del
//usuario, sino retornara un error 
userSchema.statics.findByToken = function (token,cb){
    var user = this;

    jwt.verify(token,process.env.SECRET,function(err,decode){
        user.findOne({'_id':decode,'token':token},function(err,user){
            if(err) return cb(err);
            cb(null,user);
        })
    })
}





const User = mongoose.model('User', userSchema, 'users');
module.exports = { User }
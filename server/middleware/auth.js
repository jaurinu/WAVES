//el middleware actua antes o durante lo que se esta ejecutando. En este caso
//convierte lo que obtenemos del body del json
//auth recibe una peticion una respuesta y un next
//creamos una variable token que sera igual a la informacion que recibimos en la
//peticion (cookies)
//Una vez obtenido el token verificamos de la siguiente manera
//usamos una funcion, para encontrar al usuario, que recibira el token, despues de 
//obtenerlos ejecutara una funcion cb que recibira un error y un usuario.
//Si existe un error, devuelve el error, si no existe usuario retorna una respuesta
//json con auth falsa y error verdadero. Si obtiene el usuario la peticion token 
//sera igual al token y la peticion user (req.user) sera igual a la data del 
//usuario. Pasando este filtro seguira a la siguiente funcion (next)

//Esta funcion findByToken sera creada en el archivo user.js


const { User } = require('../models/user');

let auth = (req,res,next) => {
    let token = req.cookies.w_auth;

    User.findByToken(token,(err,user)=>{
        if(err) throw err;
        if(!user) return res.json({
            isAuth: false,
            error: true
        });
        req.token = token;
        req.user = user;
        next();
    })

}

module.exports = { auth }
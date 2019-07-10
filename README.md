##Dependencias instaladas en server

bcrypt - encode password
body-parser - se utiliza con express para leer los jsons
cloudinary
concurrently
cookie-parser- se usa con el servidor para leer cookies
dotenv - para leer las variables de entorno
express - para usar el servidor
express-formidable
jsonwebtoken - crear token
moment - times for parsing times
mongoose - conexion con la base de datos
multer - subir imagenes
dev

##dev dependencia
nodemon

##inside server

Se crea una carpeta server.js

##Antes de empezar

Se le dice a la aplicacion donde iniciar
-En el archivo package.json se crean los scripts para ello

"scripts": {
    "start" : "node server/server.js",
    "server" : "nodemon server/server.js"
}

Con nodemon no tenemos que apagar el servidor, siempre estara escuchando los cambios

##En el archivo server
* creamos una express aplication

* requerimos express y la guardamos en una variable
* instanciamos express y la guardamos en una constante app
para escuchar el servidor necesitamos un puerto, para ello creamos una variable de entorno

###Variables de entorno
Las usamos en cualquier lugar del codigo que va a cambiar dependiendo del estado en el que estemos (desarrollo, produccion, test ....)
[medium_variables_de_entorno]https://medium.com/the-node-js-collection/making-your-node-js-work-everywhere-with-environment-variables-2da8cdf6e786
[node_process.env]https://nodejs.org/api/process.html#process_process_env
[how_to_use_it]https://codeburst.io/process-env-what-it-is-and-why-when-how-to-use-it-effectively-505d0b2831e7

-------------------------------------------------------------------------------

* si no se encuentra la variable puerto se utiliza el puerto asignado

const port = process.env.PORT || 3005;

* se escucha el puerto 
app.listen(port, (cb)=>{
    console.log(`{port}`)
})

* para correr el servidor utilizamos la siguiente linea de comando
   **npmn run server**


* creamos el archivo .gitignore con los siguientes archivos que no se subiran al repositorio

/node_modules
/build
/client/node_modules

.env

npm-debug.log*
yarn-debug.log*
yarn-error.log*

* se crea el archivo .env donde se guardaran todas las variables de entorno
    para que cuando estemos en produccion tengamos un archivo que tenga guardados keyboards, contraseñas, locaciones, API keys

*  se requieren los modulos que vamos a necesitar
    + body-parser = cuando hacemos una peticion post enviaremos un json, y body parser obtiene la informacion de esa peticion
    +cookie parser = para leer las cookies cuando obtengamos la peticion
    +mongoose conexion entre la mongodb y el servidor
    +dotenv hace disponibles las variables de entorno en nuestro archivo

* se configura mongoose, con el metodo connect y el link de la base de datos.
    Para guardar la direccion de la conexion de nuestra base de datos usamos
    el archivo .env

    DATABASE=mongodb://localhost:27017/waves

* para usar bodyparser y cookieparser lo configuramos como un middleware
    vinculado con express: app.use es como registramos un middleware 
    app.use(bodyParser.urlencoded({ extended:true }));

    Si extended es falso, no puedes postear "nested object", porque no es
    soportada por la libreria querystring_library

    var qs = require("qs")
    var result = qs.parse("person[name]=bobby&person[age]=3")
    //Nested object
    console.log(result) // { person: { name: 'bobby', age: '3' } }

    Si extended es true, la URL-encoded data sera parseada con la libreria 
    qs_library

    [qs_query-string]https://stackoverflow.com/questions/29960764/what-does-extended-mean-in-express-4-0
    [body-parser]https://www.npmjs.com/package/body-parser#bodyparser-urlencoded-options
    [body-parser-2]https://www.comoaprendi.com/nodejs-introduccion/body-parser/

##Query strings

[informacion_query_strings]http://junerockwell.com/difference-parameters-query-strings-express-js/
[una_mas]https://stackabuse.com/get-query-strings-and-parameters-in-express-js/
Cadenas de consulta son los datos que aparecen en la URL de una pagina.
Se adjuntan despues de la ruta URL y van precedidos de un signo de interrogacion.
Cada uno de ellos toma la forma de un par nombre-valor que se separa con un
&. Ejemplo: http://localhost:8080/dog?breed='Whippet'

-----------------------------------------------------------------

* antes de añadir datos a mongodb necesitamos una ruta

* creamos la ruta app.post para recibir los datos del usuario
    app.post('/api/users/register', (req,res)=>{
        res.status(200);
    })

    despues de la ruta recibimos una peticion y la respuesta. En este caso al obtener la peticion la respuesta sera un status 200

*creamos un modelo de usuario, para ello en la carpeta server creamos una carpeta llamada models dentro vamos a tener User.js

       + requerimos mongoose. lo necesitamos para validar y crear el MongodbSchema
       + requerimos Schema para definir los requerimientos de los
       datos del usuario
       + y los guardamos en una constante

       + crearemos una constante User que sera igual a mongoose.model('nombre del modelo', nombre del schema, nombre de la coleccion de la bd)

       + lo exportamos con module.exports

        const mongoose = require('mongoose');

        const userSchema = mongoose.Schema({
    
        });

        const User = mongoose.model('User', userSchema, 'users');
        module.exports = { User }**

    [creacion_de_usuarios]https://vegibit.com/node-js-mongodb-user-registration/
    [api_rest]https://medium.com/@_aerdeljac/creating-a-rest-api-backend-using-express-js-7710d3310b79

*en el archivo server importamos el modelo user 
    const { User } = require('./models/user');

*usamos postman para verfificar que la conexion con la bd y la transferencia de datos
cliente-servidor funciona

*terminamos la ruta destinada a registrar nuevos usuarios

    app.post('/api/users/register',(req,res)=>{
    //res.status(200).send('Funciona la conexion')
    const user = new User(req.body);

    user.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({
            success: true,
            //userdata: doc // el documento es un json por lo que se puede obtener
            //solo un parametro del mismo: doc.name
        })
    })
});

*se verifica en postman

*antes de guardar un nuevo usuario se encriptara el password

    +traemos las dependencias que necesitamos para eso 
    -bcrypt
    guardamos en una constante SALT_I la cantidad de bits aleatorios que se usan
    para generar un cifrado 
    -SALT_I

    [salt]https://es.wikipedia.org/wiki/Sal_(criptograf%C3%ADa)
    [salt2]https://auth0.com/blog/adding-salt-to-hashing-a-better-way-to-store-passwords/
    [another_one]https://crackstation.net/hashing-security.htm


*creamos la ruta y peticion tipo POST para loguear al usuario
    +necesitaremos generar una funcion que compare los passwords, dentro del archivo user.js

*se realiza la funcion para generar el token
*se crea la ruta para autentificar al usuario
    +se crea un directorio middleware y dentro un archivo auth.js
    +se importa el modelo User en este nuevo archivo y se crea la funcion
    que recibira la peticion, las respuesta y next
    +auth se importa en el archivo server.js
    +en el archivo auth se crea la funcion de autenticacion la cual necesitara
     ejecutar una funcion que decodifique el token y verifique que pertenece a
     un usuario. 
    +Esta funcion se crea en el archivo user.js

*se crea la funcion logout

-----------------------------------------------

*Se crearan dos categorias de productos una de marcas (Brand) y otra de Wood, 
cada una tendra un modelo Schema, para subir esta informacion ser require crear
el rol de administrador quien estara autorizado para realizar la accion.

*Se creara la ruta para subir la informacion Brand de los productos con el metodo POST y la siguiente ruta

    app.post('/api/product/brand',auth,admin,(req,res)=>{

    })

    +la ruta post requiere que la persona que realice la accion de postear los productos a la base de datos este autenticada y tenga el rol de administrador
    +Se crea el modelo de Brand en un archivo brand.js dentro del directorio models
    +Se crea el middleware admin que verifica que la persona tenga el rol de administrador en un nuevo archivo llamado admin.js

*Se crea la ruta con el metodo GET para obtener todas las marcas que se han creado

*Se realizan las rutas POST y GET para la categoria WOOD, tambien se crea el modelo Schema Wood 

*Se crea un endpoint donde el administrador pueda subir nuevas guitarras
    +Se crea el modelo Schema Product.js
    +la ruta con el metodo POST para crear un nuevo articulo
    +la ruta para obtener los articulos por ID
    +la ruta para obtener los articulos por fecha de llegada y otro de fecha de
    venta, los articulos encontrados se ordenaran 

[$in]https://docs.mongodb.com/manual/reference/operator/query/in/
[populate]https://carlosazaustre.es/como-relacionar-tus-modelos-en-mongodb/
[populate2]https://mongoosejs.com/docs/populate.html

s

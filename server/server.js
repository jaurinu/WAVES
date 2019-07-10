
//Requerimos los modulos que vamos a utilizar y los guardamos en sus
//respectivas constantes
//express para crear el servidor 
//body parser extrae los datos del body y los convierte en json
//cookie parser para leer las cookies cuando obtengamos la peticion
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//instanciar express y guardarlo en app, cualquier cosa que queramos usar
//de express server nos referimos a app
//mongoose conexion entre la mongodb y el servidor
//dotenv hace disponibles las variables de entorno en nuestro archivo
const app = express();
const mongoose = require('mongoose');
require('dotenv').config()

//models
//Se importan los modelos 
const { User } = require('./models/user');
const { Brand } = require('./models/brand');
const { Wood } = require('./models/wood');
const { Product } = require('./models/product');

//middlewares
const { auth } = require('./middleware/auth');
const { admin } = require('./middleware/admin');

//se configura mongoose, con el metodo connect y el link de la base de datos
//DATABASE es la ruta de conexion de la bd de mongodb en nuestra computadora
//que se guarda en el archivo .env, la direccion es la misma en el entorno de
//produccion y desarrollo
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true }, (err) => {
    if (err){
        return err
    }
    console.log('Conectado a MongoDB')
})


//para usar bodyparser y cookieparser lo configuramos como un middleware
//vinculado con express: app.use es como registramos un middleware 
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.use(cookieParser());

//-------------PRODUCTS--------------

//En esta peticion tipo GET se obtendran los articulos y se ordenaran de la siguiente
//manera:

//BY ARRIVAL
// /articles?sortBy=createdAt&order=desc&limit=4

//BY SELL
// /articles?sortBy=sold&order=desc&limit=4

//es una cadena de consulta donde el primer atributo especifica el valor que 
//utilizara para ordenar los documentos encontrados, en este caso sera la 
//fecha de creacion (llegada: createdAt) o cuando fueron vendidos (SOLD), 
//el segundo atributo representa la forma en que los va a ordenar: descendente  
//el ultimo atributo es el limite de articulos desplegados en la busqueda

//el primer argumento sera la ruta, el segundo un callback que tiene una peticion
//y un respuesta. Dentro de la funcion se guardaran en una variable de nombre
//order un ternario que especifica si existe dentro de la peticion el tipo de 
//ordenamiento que se le dara a los articulos, de estar especificado se ordena
//de esa manera, en caso contrario se ordena de forma ascendente.
//lo mismo para otra variable de nombre sortBy, en la cual se pregunta si 
//en la peticion existe el parametro que usara para buscar los documentos, de
//venir especificados se utiliza ese argumento en caso contrario se hace la busqueda
//por id. La ultima variable guadara el limite de articulos que se desplegaran de no 
//encontrarse especificados en la peticion se desplegaran 100

//Finalmente se hace la peticion: usando el modelo schema, aplicandole el metodo
//find, despues se ejecuta populate para desplegar el contenido de la coleccion
//brand y wood, despues se aplica el metodo .sort que tendra una matriz dentro
//de otra matriz y que contiene la variable sortBy.order, despues se le pasa el 
//limite.
//Se ejecuta y si hay un error retorna el error, sino envia los articulos encontrados

app.get('/api/product/articles',(req,res)=>{
    let order = req.query.order ? req.query.order : 'asc';
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id';
    let limit = req.query.limit ? parseInt(req.query.limit) : 100;
    
    Product.
    find().
    populate('brand').
    populate('wood').
    sort([[sortBy.order]]).
    limit(limit).
    exec((err,articles)=>{
        if(err)return res.status(400).send(err);
        res.send(articles)
    })
    
})

//Se crea la ruta para extraer los articulos por ID
//Hay dos formas de obtener informacion del cliente, una es a partir de un json y la
//otra es con una cadena de consulta (query string)
//ruta ? atributos=valores & atributos = valores
//al poner varios id los concatenamos con el atributo type = que especifica si es un 
//array o un solo articulo
//El metodo get tiene la ruta desde donde se ejecutara la accion de obtener los articulos
//por id y como siguiente argumento un callback que tendra una peticion y una respuesta
//Dentro de la funcion especificamos en una variable llamada "type" el tipo de 
//busqueda que realizaremos: busqueda de un solo articulo "single" o busqueda
//de varios articulos "array", en la peticion se especificara el tipo dentro de la 
//cadena de consulta (req.query.type)
//el query lo obtenemos con la libreria body-parser.urlencoded
//Creamos la variable "items" para guardar en ella lo que sea que obtengamos de la
//cadena de consulta, en este caso son los IDs.
//Se evalua en una condicion si el tipo es "array", de ser verdadero se guarda en una
//variable los ids obtenidos en la cadena de consulta y se divide el objeto
//eliminando las comas 
//la variable items se convierte en un array 
//en esa misma variable se iteran por medio de un map cada uno de los ids que 
//fueron separados y regresa en el array cada item convertido en un ObjetoID 
//de mongoose.
//Una vez ejecutada la condicion, se realiza la peticion
//A partir del modelo schema Product se aplica el metodo find, dentro de find
//especificamos lo que queremos encontrar, en este caso buscamos el '_id':
//utilizamos el operador de mongodb $in para seleccionar los documentos 
//que corresponden a los items de la matriz
//se utiliza populate para desplegar todo el contenido del ObjectID de la 
//Brand y Wood
//se ejecuta y se corre el callback que tiene un error y los documentos, si ha error
//retorna el error, en caso contrario la respuesta es un status (200) y el envio de
//los articulos

/// /api/product/article?id=HSHSHSKSK,JSJSJSJS,SDSDHHSHDS,JSJJSDJ&type=single
app.get('/api/product/articles_by_id',(req,res)=>{
    let type = req.query.type;
    let items = req.query.id;

    if(type === "array"){
        let ids = req.query.id.split(',');
        items = [];
        items = ids.map(item=>{
            return mongoose.Types.ObjectId(item)
        })
    }
    Product.
    find({ '_id':{$in:items}}).
    populate('brand').
    populate('wood').
    exec((err,docs)=>{
        if (err) return res.status(400).send(err);
        res.status(200).send(docs)
    })
});



app.post('/api/product/article',auth,admin,(req,res)=>{
    const product = new Product(req.body);

    product.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({
            succes:true, 
            product: doc
         })
    })
})


//--------------WOOD-----------------

app.post('/api/product/wood',auth,admin,(req,res)=>{
    const wood = new Wood(req.body);

    wood.save((err,doc)=>{
        if(err) return res.json({succes:false,err});
        res.status(200).json({
            succes:true,
            wood: doc
        })    
    })
});

app.get('/api/product/woods',(req,res)=>{
    Wood.find({},(err,woods)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send(woods)
    })
})


//-------------BRAND-----------------

//Para crear la peticion para la categoria Brand creamos una nueva ruta /api/product/brand
//para subir la informacion la persona que realice la accion de subir productos a la
//base de datos debera estar logueada y tener el rol de administrador, por lo que
//tendra que pasar por los middlewares correspondientes antes de ejecutar la 
//funcion que tendra una peticion y una respuesta.
//Dentro de la funcion se creara una nueva "Brand" por lo que se requiere un modelo
//Dentro de una constante brand, se guardara la nueva Brand (model schema) que recibira
//informacion del body
//Aplicamos el metodo save para guardar, en la base de datos, la informacion que 
//tenemos en la constante.
//Este metodo ejecuta una funcion que tiene un callback un error y un documento
//si hay error la respuesta sera un json con el mensaje de error, en caso contrario
//la respuesta sera el status (200) y un json con un mensaje success true y la informacion
//de brand
app.post('/api/product/brand',auth,admin,(req,res)=>{
    const brand = new Brand(req.body);
    
    brand.save((err,doc)=>{
        if(err) return res.json({succes:false,err});
        res.status(200).json({
            succes:true,
            brand:doc
        })

    })
})

//Para obtener las "brands" creamos una ruta con un metodo GET, como segundo
//parametro tendra un callback con una peticion y una respuesta, dentro de la
//funcion vamos a buscar con el metodo find aplicado al modelo Brand todas las 
//marcas disponibles {} , como segundo parametro es una callback que tiene un 
//error y las marcas, si hay error lo retorna y si no la respuesta sera un
//status 200 y enviara los documentos
app.get('/api/product/brands',(req,res)=>{
    Brand.find({},(err,brands)=>{
        if(err) return res.status(400).send(err);
        res.status(200).send(brands)
    })
})



//--------------USERS------------------


//creacion de rutas destinadas al intercambio de datos relacionadas con el usuario

//Cada vez que se visita una ruta nueva, debemos constatar que el usuario posee un
//token.
//Se crea una peticion tipo get, porque no estamos recibiendo ninguna informacion
//solo estamos obteniendo las cookies, que estan dentro de cualquier peticion
//Se crea un middleware (auth) que siempre este escuchando los movimientos del usuario y 
//autenticandolo
//Hacemos una peticion, lo siguiente que realizara es correr el middleware auth que
//recibira un peticion y una respuesta, con lo que verificara si el token 
//corresponde al usuario y si todo es correcto seguira adelante. Si sigue adelante
// (next) se ejecutara la funcion callback. Si algo sale equivocado mandara un error
//y no se ejecutara la siguiente peticion.
//Cuando la respuesta es positiva (el usuario esta autenticado) se ejecuta el callback
//que tendra una respuesta con un status 200 y mostrara un json con los
//datos del usuario que manda el middleware. Esta informacion se enviara a lado del 
//cliente para permitir acceso a las paginas que puede tener acceso al usuario y que 
//pueda usar la data del mismo

app.get('/api/users/auth',auth,(req,res)=>{
    res.status(200).json({
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        cart: req.user.cart,
        history: req.user.history
    })
})

//para registrar un usuario creamos una ruta con el metodo POST
//app.post/ es una peticion para enviar la informacion al servidor. 
//Recibe dos parametros (la ruta, y un callback)
//la funcion callback recibe dos parametros: req.- representa la peticion y 
//res.- representa la respuesta.
//Cuando se realice una peticion tipo post se creara un nuevo modelo de usuario
//(UserSchema) se encapsularan los datos del body en el json que estamos recibiendo y 
//se almacenaran. Cuando se guarda algo el servidor regresa la respuesta de que 
//fue guardado dentro de mongo o un error en caso contrario:
//Usamos el modelo User para crear un nuevo usuario y establecer los datos de 
//registro que obtendremos de la peticion (req.body), los guardamos en una const user
//Este nuevo usuario lo guardamos en mongo: user.save, este metodo recibe dos parametros
//un error o una respuesta y se ejecuta con una comparacion
//si existe un error regresa una respuesta tipo json {} con el mensaje success:false
//si no existe error envia la respuesta con un status 200 y un json con el mensaje
//success:true 
app.post('/api/users/register',(req,res)=>{
    //res.status(200).send('Funciona la conexion')
    const user = new User(req.body);

    user.save((err,doc)=>{
        if(err) return res.json({success:false,err});
        res.status(200).json({
            success: true,
            //userdata: doc
        })
    })
});


//para loguear al usuario realizamos una peticion tipo POST en la que recibiremos los
//datos introducidos por el candidato: express.metodo('ruta de login', (peticion, respuesta) funcion)
//los pasos a seguir para determinar si el usuario existe son:
//encontrar el email proporcionado
//comparar el password
//generar un token
//Utilizamos el model User, entramos a la base de datos y tratamos de encontrar el email
//en ella con el metodo findOne. Este metodo necesita saber que es lo que estamos buscando
//que en este caso es el email del usuario en la bd: req.body.email es el json que
//recibimos en el body, despues de recibirlo corremos una cb function que contendra
//un error o el usuario actual. Si no existe el usuario regresa una respuesta json
//con el mensaje "email no encontrado" de caso contrario seguira con la siguiente
//linea de codigo que es comparar los password con el metodo user.comparesPassword
//el user se refiere al usuario actual obtenido de la data
//la funcion comparePassword espera dos argumentos(el password recibido del body,
//(y una funcion cb)) esta cb puede obtener un error, o un buleano para isMatch
//si son equivalentes sera un true y sigue a la siguiente funcion para generar un 
//token, sino un false y se regresara la respuesta json
//con el mensaje: "Contraseña incorrecta"
//para generar el token se crea el metodo generateToken que recibira dos argumentos
//de un cb un error o el usuario actualizado con el token generado
//si hay un error la respuesta sera un status 400 y el error
//si hay un usuario actualizado guardamos el token como una cookie, el primer argumento
//es el nombre de la cookie el segundo es el token actual 
    app.post('/api/users/login',(req,res)=>{
    //find the email
    User.findOne({'email':req.body.email},(err,user)=>{
        if(!user) return res.json({loginSuccess:false,message:'Email no encontrado'});

        user.comparePassword(req.body.password,(err,isMatch)=>{
            if(!isMatch) return res.json({loginSuccess:false,message:'Contraseña incorrecta'});

            user.generateToken((err,user)=>{
                if(err) return res.status(400).send(err);
                res.cookie('w_auth',user.token).status(200).json({
                    loginSuccess:true
                })
            })
        })
    })
})


//Para crear la funcion logout, creamos la ruta correspondiente con una peticion
//tipo GET.
//Para realizar el logout el usuario tendra que estar logueado, es decir que debe
//estar autenticado, por lo que usaremos el middleware auth. Si el usuario no esta
//autenticado e intenta ir a la ruta logout el middleware auth rechazara la peticion
//en caso contrario se ejecutara el callback.
//Al modelo USer le aplicamos el metodod findOneAndUpdate y buscamos el id que corresponda
//con el id que obtenemos de la funcion auth y el token lo dejamos vacio, despues
//tenemos una callback que tendra un error y un documento, si hay un error envia
//una respuesta con un mensaje de error, si logramos destruie el token la respuesta
//de status sera 200 y enviara un mensaje de success: true
app.get('/api/users/logout',auth,(req,res)=>{
    User.findOneAndUpdate(
        {_id:req.user._id},
        {token:''},
        (err,doc)=>{
            if(err) return res.json({success:false,err});
            return res.status(200).send({
                success: true
            })
        }
    )
})


//el servidor necesita un puerto: process.env es una variable de entorno de node
//que regresa un objeto que contiene el entorno del usuario. en este caso
//si no se encuentra la variable PORT se corre el servidor en el puerto 3005
const port = process.env.PORT || 3005;

//se comienza la aplicacion escuchando el puerto, despues se crea un callback
//que muestre en consola que el puerto esta corriendo
    app.listen(port, ()=>{
    console.log(`Server Runing at ${port}`)
})


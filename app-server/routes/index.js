var express = require('express');
var router = express.Router();
var formidable = require('formidable')
var fs = require("fs")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', function(req, res) {

  let form = new formidable.IncomingForm({

    uploadDir: './upload',
    keepExtensions: true

  })

  form.parse(req, (err, fields, files)=>{
    res.json({
      files:files
    })
  })


})

router.delete('/file', function(req,res){

  let form = new formidable.IncomingForm({

    uploadDir: './upload',
    keepExtensions: true

  })
  // exclusao do arquivo no discorigido/pastalocal
  form.parse(req, (err, fields, files)=>{

    
    if(fs.existsSync(fields.path)){

      fs.unlink(fields.path, err =>{

        if(err){
          res.status(400).json({err})
        } 
        else{
          res.json({
            fields
          })
        }})}   
    else{

          res.status(404).json({
            error: 'File not found.'
          })
        }
  })

})

router.get('/file', (req, res)=>{

  let path = "./" + req.query.path

  //verifica se o arquivo existe
  if(fs.existsSync(path)){
  
    //tenta carregar o arquivo
    fs.readFile(path, (err,data) =>{

      if(err){

        console.log(err)
        res.status(400).json({
          error: err
        })
      }
      else{
        res.status(200).end(data)
      }

    })

  }
   else{

    res.status(404).json({
      error: 'File not found.'
    })
  }

} )

module.exports = router;

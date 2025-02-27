class DropBoxController {
    constructor(){

        this.currentFolder = ["dropbox"]

        this.navEl = document.querySelector("#browse-location")
        this.btnSend = document.querySelector("#btn-send-file");
        this.InputFilesEl = document.querySelector("#files");
        this.snackModalEl = document.querySelector("#react-snackbar-root");
        this.progressBarEl = document.querySelector(".mc-progress-bar-fg");
        this.fileNameEl = document.querySelector(".filename")
        this.timeLeftEl = document.querySelector(".timeleft")
        this.listFilesEl = document.querySelector("#list-of-files-and-directories")
       
        //criaçao de um evento chamado "selectionC"
        this.onselectionchange = new Event('selectionchange')

        this.newPasteBtn =  document.querySelector("#btn-new-folder")
        this.renameBtn =  document.querySelector("#btn-rename")
        this.excludeBtn = document.querySelector("#btn-delete")

        this.connectFirebase();
        this.initEvents();
        this.openFolder()
    }

    getSelection(){

        return this.listFilesEl.querySelectorAll(".selected")
    }

    removeFolderTask(ref, name){

        return new Promise((resolve, reject) =>{

            let folderRef = this.getFirebaseRef(ref + '/' + name)

            folderRef.on('value', snapshot => {
                
                folderRef.off('value')



                snapshot.forEach(item => {

                    let data = item.val();
                    data.key = item.key

                    if(data.type === 'folder'){

                        this.removeFolderTask(ref + '/' + name, data.name).then(()=>{
                            resolve({
                                fields:{
                                    key:data.key
                                }
                            })
                        }).catch(err =>{

                            reject(err)
                        })

                    } 
                    else if(data.type){

                        this.removeFile(ref + '/' + name, data.name).then(()=>{
                            resolve({
                                fields:{
                                    key:data.key
                                }
                            })
                        }).catch(err =>{

                            reject(err)
                        })

                    }
                })
            
            folderRef.remove()
            


            })

        })



    }

    removeTask(){

        let promisses = [];

        this.getSelection().forEach(li =>{

            let key = li.dataset.key;
            let file = JSON.parse(li.dataset.fileObj)
            
            promisses.push(new Promise ((resolve,reject) =>{
                
                if(file.type === 'folder'){
                
                    this.removeFolderTask(this.currentFolder.join('/'), file.name).then(()=>{
                        
                        resolve({
                            fields:{
                               key 
                            }})
                    })

                } else if (file.type){

                    this.removeFile(this.currentFolder.join('/'), file.name).then(()=>{
     
                        resolve({
                         fields:{
                            key 
                         }})})}
             }))

        })
        return Promise.all(promisses)
        


    }

    removeFile(ref, file){
       
        let fileRef = firebase.storage().ref(ref).child(file)

        return  fileRef.delete()
    }

    initEvents(){
        
        //NEW PASTE
        this.newPasteBtn.addEventListener("click", e=>{

            let name = prompt("Nome da nova pasta:")
            if(name){

                this.getFirebaseRef().push().set({
                    name,
                    type:"folder",
                    path:this.currentFolder.join("/")

                })

            }
        })
        // EXCLUDE 
        this.excludeBtn.addEventListener('click', e=>{

            this.removeTask().then(responses =>{


               responses.forEach(resp =>{

                if(resp.fields.key){
                    
                    this.getFirebaseRef().child(resp.fields.key).remove()

                }

               })

            }).catch(err =>{


                console.log(err)
            })



        })
       //RENAME
        this.renameBtn.addEventListener('click', e=>{

            let li = this.getSelection()[0]

            let file = JSON.parse(li.dataset.fileObj)
            console.log(file)
            let newName = prompt("Renomear arquivo", file.originalFilename)

            if(newName){
                file.originalFilename = newName

                //renomeia no database
                this.getFirebaseRef().child(li.dataset.key).set(file)

            }

        })

        //menu dinamico showing or not the rename/exclude btn
        this.listFilesEl.addEventListener("selectionchange", e=>{
            switch(this.getSelection().length){

                case 0:

                this.excludeBtn.style.display = "none";
                this.renameBtn.style.display = "none";

                break;

                case 1:
                    this.excludeBtn.style.display = "block";
                    this.renameBtn.style.display = "block";
                break;

                default:
                    this.excludeBtn.style.display = "block";
                    this.renameBtn.style.display = "none";

                break;
                
                


            }
        })

        //enviar
        this.btnSend.addEventListener("click", e => {
            
            this.InputFilesEl.click();

        })

        this.InputFilesEl.addEventListener("change", event => {

            this.btnSend.disabled = true

            this.uploadTask(event.target.files).then(responses =>{
            
                responses.forEach(resp => 
                    { resp.ref.getDownloadURL().then(data=>{ this.getFirebaseRef().push().set(
                        {   name: resp.name, 
                            type: resp.contentType, 
                            path: data, 
                            size: resp.size }); 
                    });});
             
                this.uploadComplete()

            }).catch(err => {
                console.log(err)
            })

            this.ModalShow()

        })

    }

    //acionado quando termina o updload de um arquivo 
    uploadComplete(){

        this.ModalShow(false)

        this.InputFilesEl.value = "";

        this.btnSend.disabled = false;
    }

    //conexão com o banco de dados
    connectFirebase(){
        
        const firebaseConfig = {
            apiKey: "AIzaSyBuxbv_6N4CJMb85ZsGLKB9h__-pWxrHqQ",
            authDomain: "dropbox-clone-8d072.firebaseapp.com",
            databaseURL: "https://dropbox-clone-8d072-default-rtdb.firebaseio.com",
            projectId: "dropbox-clone-8d072",
            storageBucket: "dropbox-clone-8d072.appspot.com",
            messagingSenderId: "866406308108",
            appId: "1:866406308108:web:33bfe3587aafc91a79d129",
            measurementId: "G-43TTSY39GT"
          };
        
          // Initialize Firebase
          const app = firebase.initializeApp(firebaseConfig);
          
    }

    //acessa o firebase e da uma ref para onde as informações dos files serão armazenadas
    getFirebaseRef(path){

        if(!path) path = this.currentFolder.join('/')

        return firebase.database().ref(path)

    }

    // function para abertura e fechamento da barra de carregamento durante o upload dos files
    ModalShow(show = true){

         this.snackModalEl.style.display = (show) ?"block" : "none";

    }

   /* ajax(url, method = 'GET', formData = new FormData, onprogress = function(){}, onloadstart = function(){}){

        return new Promise((resolve,reject) => {
            let ajax = new XMLHttpRequest();

            ajax.open(method, url)

            ajax.onload = event =>{

                try{
                    resolve(JSON.parse(ajax.responseText))

                } catch(e){
                    reject(e)
                }
            }

            ajax.onerror = event =>{
                
                reject(event)
            }

            ajax.upload.onprogress = onprogress;

            onloadstart();

            ajax.send(formData)
            }

        )
        
    }*/

// função que recebe os files e promove o upload destes atraves do AJAX (assincronidade)
    uploadTask(files){

        let promisses = []
        let fileArray = [...files]

        //receiving more than 1 file to upload, we will need put then in array and use a foreach to atributte a promisse for each one of these files, looking if then was resolved(loaded + parse(ajax.responsetext)) or rejected (no loaded and has a error.) 

        fileArray.forEach(file => {

            
            promisses.push(new Promise((resolve, reject)=>{
                let fileRef = firebase.storage().ref(this.currentFolder.join('/')).child(file.name)
    
                let task = fileRef.put(file)
    
                
                task.on('state_changed', snapshot =>{
                    
                    this.uploadProgress({
                        loaded:snapshot.bytesTransferred,
                        total:snapshot.totalBytes
                    }, file)
    
                   
    
                }, error =>{
    
                    console.log(error)
                    reject(error)
                   
    
                }, () =>{
    
                    fileRef.getMetadata().then(metadata =>{
    
                        resolve(metadata)
    
                    }).catch(err=>{
    
                        console.log(err)
                        reject(err)
    
                    })
    
                  
                });
    
              
            })

            )})
        
        return Promise.all(promisses)

        
        
    }

//formatação da porcentagem e crescimento da barra de upload
   uploadProgress(event, file){


        let timespent = Date.now() - this.startUploadTime;
        let loaded = event.loaded;
        let total = event.total;
        let porcent = parseInt((loaded/total) * 100)
        let timeleft = ((100 - porcent)*timespent)/porcent

        this.progressBarEl.style.width = `${porcent}%`

        this.fileNameEl.innerHTML = file.name;
        this.timeLeftEl.innerHTML = this.formatTimeToHuman(timeleft);

        
       

    }
// formatação do tempo na barra de upload 
    formatTimeToHuman(duration){
        
        let seconds = parseInt((duration/1000) % 60);
        let minutes =  parseInt((duration/1000*60)  % 60);;
        let hours =  parseInt((duration/1000*60*24) % 60);;

        if(hours > 0 ){
            return `${hours} horas, ${minutes} minutos e ${seconds} segundos.`
        }

        else if(minutes > 0 ){
            return ` ${minutes} minutos e ${seconds} segundos.`
        }

        else if(seconds > 0 ){
            return ` ${seconds} segundos.`
        }
        else{

            return "0 segundos"
        }




    }

    // tratamento dos icons para retornar determinado ICON de acordo com o tipo de arquivo enviado criando sua categoria e o armazenando nela.
    getFileIconView(file){


        switch(file.type){

            case undefined:
                return 

            case"image/jpg":
            case"image/jpeg":
            case "image/png":
            case "image/gif":
                return `<svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                    <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                    <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                    </feColorMatrix>
                </filter>
                <title>Imagem</title>
                <g>
                    <g>
                        <g filter="url(#mc-content-unknown-large-a)">
                            <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                    C43,31.791,44.791,30,47,30z"></path>
                        </g>
                        <g>
                            <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                    c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                        </g>
                    </g>
                </g>
                <g>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M81.148,62.638c8.086,0,16.173-0.001,24.259,0.001
                            c1.792,0,2.3,0.503,2.301,2.28c0.001,11.414,0.001,22.829,0,34.243c0,1.775-0.53,2.32-2.289,2.32
                            c-16.209,0.003-32.417,0.003-48.626,0c-1.775,0-2.317-0.542-2.318-2.306c-0.002-11.414-0.003-22.829,0-34.243
                            c0-1.769,0.532-2.294,2.306-2.294C64.903,62.637,73.026,62.638,81.148,62.638z M81.115,97.911c7.337,0,14.673-0.016,22.009,0.021
                            c0.856,0.005,1.045-0.238,1.042-1.062c-0.028-9.877-0.03-19.754,0.002-29.63c0.003-0.9-0.257-1.114-1.134-1.112
                            c-14.637,0.027-29.273,0.025-43.91,0.003c-0.801-0.001-1.09,0.141-1.086,1.033c0.036,9.913,0.036,19.826,0,29.738
                            c-0.003,0.878,0.268,1.03,1.069,1.027C66.443,97.898,73.779,97.911,81.115,97.911z"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M77.737,85.036c3.505-2.455,7.213-4.083,11.161-5.165
                            c4.144-1.135,8.364-1.504,12.651-1.116c0.64,0.058,0.835,0.257,0.831,0.902c-0.024,5.191-0.024,10.381,0.001,15.572
                            c0.003,0.631-0.206,0.76-0.789,0.756c-3.688-0.024-7.375-0.009-11.062-0.018c-0.33-0.001-0.67,0.106-0.918-0.33
                            c-2.487-4.379-6.362-7.275-10.562-9.819C78.656,85.579,78.257,85.345,77.737,85.036z"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M87.313,95.973c-0.538,0-0.815,0-1.094,0
                            c-8.477,0-16.953-0.012-25.43,0.021c-0.794,0.003-1.01-0.176-0.998-0.988c0.051-3.396,0.026-6.795,0.017-10.193
                            c-0.001-0.497-0.042-0.847,0.693-0.839c6.389,0.065,12.483,1.296,18.093,4.476C81.915,90.33,84.829,92.695,87.313,95.973z"></path>
                    <path fill-rule="evenodd" clip-rule="evenodd" fill="#848484" d="M74.188,76.557c0.01,2.266-1.932,4.223-4.221,4.255
                            c-2.309,0.033-4.344-1.984-4.313-4.276c0.03-2.263,2.016-4.213,4.281-4.206C72.207,72.338,74.179,74.298,74.188,76.557z"></path>
                </g>
                </svg>`
                break;


            case"application/pdf":
                return `<svg version="1.1" id="Camada_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="160px" height="160px" viewBox="0 0 160 160" enable-background="new 0 0 160 160" xml:space="preserve">
                <filter height="102%" width="101.4%" id="mc-content-unknown-large-a" filterUnits="objectBoundingBox" y="-.5%" x="-.7%">
                    <feOffset result="shadowOffsetOuter1" in="SourceAlpha" dy="1"></feOffset>
                    <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1">
                    </feColorMatrix>
                </filter>
                <title>PDF</title>
                <g>
                    <g>
                        <g filter="url(#mc-content-unknown-large-a)">
                            <path id="mc-content-unknown-large-b_2_" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47c-2.209,0-4-1.791-4-4V34
                                    C43,31.791,44.791,30,47,30z"></path>
                        </g>
                        <g>
                            <path id="mc-content-unknown-large-b_1_" fill="#F7F9FA" d="M47,30h66c2.209,0,4,1.791,4,4v92c0,2.209-1.791,4-4,4H47
                                    c-2.209,0-4-1.791-4-4V34C43,31.791,44.791,30,47,30z"></path>
                        </g>
                    </g>
                </g>
                <path fill-rule="evenodd" clip-rule="evenodd" fill="#F15124" d="M102.482,91.479c-0.733-3.055-3.12-4.025-5.954-4.437
                        c-2.08-0.302-4.735,1.019-6.154-0.883c-2.167-2.905-4.015-6.144-5.428-9.482c-1.017-2.402,1.516-4.188,2.394-6.263
                        c1.943-4.595,0.738-7.984-3.519-9.021c-2.597-0.632-5.045-0.13-6.849,1.918c-2.266,2.574-1.215,5.258,0.095,7.878
                        c3.563,7.127-1.046,15.324-8.885,15.826c-3.794,0.243-6.93,1.297-7.183,5.84c0.494,3.255,1.988,5.797,5.14,6.825
                        c3.062,1,4.941-0.976,6.664-3.186c1.391-1.782,1.572-4.905,4.104-5.291c3.25-0.497,6.677-0.464,9.942-0.025
                        c2.361,0.318,2.556,3.209,3.774,4.9c2.97,4.122,6.014,5.029,9.126,2.415C101.895,96.694,103.179,94.38,102.482,91.479z
                        M67.667,94.885c-1.16-0.312-1.621-0.97-1.607-1.861c0.018-1.199,1.032-1.121,1.805-1.132c0.557-0.008,1.486-0.198,1.4,0.827
                        C69.173,93.804,68.363,94.401,67.667,94.885z M82.146,65.949c1.331,0.02,1.774,0.715,1.234,1.944
                        c-0.319,0.725-0.457,1.663-1.577,1.651c-1.03-0.498-1.314-1.528-1.409-2.456C80.276,65.923,81.341,65.938,82.146,65.949z
                        M81.955,86.183c-0.912,0.01-2.209,0.098-1.733-1.421c0.264-0.841,0.955-2.04,1.622-2.162c1.411-0.259,1.409,1.421,2.049,2.186
                        C84.057,86.456,82.837,86.174,81.955,86.183z M96.229,94.8c-1.14-0.082-1.692-1.111-1.785-2.033
                        c-0.131-1.296,1.072-0.867,1.753-0.876c0.796-0.011,1.668,0.118,1.588,1.293C97.394,93.857,97.226,94.871,96.229,94.8z"></path>
            </svg> `
            break;


            case "audio/mp3":
            case"audio/wav":
                return`<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                <title>content-audio-large</title>
                <defs>
                    <rect id="mc-content-audio-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                    <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-audio-large-a">
                        <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                    </filter>
                </defs>
                <g fill="none" fill-rule="evenodd">
                    <g>
                        <use fill="#000" filter="url(#mc-content-audio-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                        <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use>
                    </g>
                    <path d="M67 60c0-1.657 1.347-3 3-3 1.657 0 3 1.352 3 3v40c0 1.657-1.347 3-3 3-1.657 0-3-1.352-3-3V60zM57 78c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm40 0c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm-20-5.006A3 3 0 0 1 80 70c1.657 0 3 1.343 3 2.994v14.012A3 3 0 0 1 80 90c-1.657 0-3-1.343-3-2.994V72.994zM87 68c0-1.657 1.347-3 3-3 1.657 0 3 1.347 3 3v24c0 1.657-1.347 3-3 3-1.657 0-3-1.347-3-3V68z" fill="#637282"></path>
                </g>
            </svg>`;
                break;


            case "video/mp4":
            case "video/quicktime":
                return ` <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                <title>content-video-large</title>
                <defs>
                    <rect id="mc-content-video-large-b" x="30" y="43" width="100" height="74" rx="4"></rect>
                    <filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-video-large-a">
                        <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                    </filter>
                </defs>
                <g fill="none" fill-rule="evenodd">
                    <g>
                        <use fill="#000" filter="url(#mc-content-video-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                        <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use>
                    </g>
                    <path d="M69 67.991c0-1.1.808-1.587 1.794-1.094l24.412 12.206c.99.495.986 1.3 0 1.794L70.794 93.103c-.99.495-1.794-.003-1.794-1.094V67.99z" fill="#637282"></path>
                </g>
            </svg> `;
                break 

            case "folder":
                    return `      <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                    <title>content-folder-large</title>
                    <g fill="none" fill-rule="evenodd">
                        <path d="M77.955 53h50.04A3.002 3.002 0 0 1 131 56.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 114.995V45.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z"
                            fill="#71B9F4"></path>
                        <path d="M77.955 52h50.04A3.002 3.002 0 0 1 131 55.007v58.988a4.008 4.008 0 0 1-4.003 4.005H39.003A4.002 4.002 0 0 1 35 113.995V44.99c0-2.206 1.79-3.99 3.997-3.99h26.002c1.666 0 3.667 1.166 4.49 2.605l3.341 5.848s1.281 2.544 5.12 2.544l.005.003z"
                            fill="#92CEFF"></path>
                    </g>
                    </svg>`
                break;



            //arquivo
            default:
                return `        <svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content tile__preview tile__preview--icon">
                <title>1357054_617b.jpg</title>
                <defs>
                    <rect id="mc-content-unknown-large-b" x="43" y="30" width="74" height="100" rx="4"></rect>
                    <filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-unknown-large-a">
                        <feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset>
                        <feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix>
                    </filter>
                </defs>
                <g fill="none" fill-rule="evenodd">
                    <g>
                        <use fill="#000" filter="url(#mc-content-unknown-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                        <use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use>
                    </g>
                </g></svg>`
        }
    }
    // recebe o ICON tratato e retorna seu HTML pronto para uso.
    getFileView(file, key){
        let li = document.createElement('li')
        let li1 = document.createElement('li')
       
        //tratamento para nao exibir/criar arquivos undefineds no site.
        if(this.getFileIconView(file) == undefined){
           
            li.dataset.key = key;
            li.dataset.fileObj = JSON.stringify(file)
    
            this.initEventsLi(li)
    
            return li
        }

        else{

            if(file.originalFilename){
              
                li1.dataset.key = key;
                li1.dataset.fileObj = JSON.stringify(file)
    
                li1.innerHTML =`         
            
                ${this.getFileIconView(file)}
                <div class="name text-center">${file.originalFilename}</div>
                     `
                this.initEventsLi(li1)
    
                return li1
            }
            else{
    
                li.dataset.key = key;
                li.dataset.fileObj = JSON.stringify(file)
        
                li.innerHTML =`         
                
                ${this.getFileIconView(file)}
                <div class="name text-center">${file.name}</div>
            `
                
                this.initEventsLi(li)
        
                return li
    
            }

        }



      
    }

    //fica escutando as mudanças feitas no firebase, trazendo os valores atuais presentes no database = ASSINCRONIDADE 
    //DTBASE - CLIENT  
    readFiles(){

        this.lastFolder = this.currentFolder.join('/')

        this.getFirebaseRef().on("value",currentValues  =>{
            
            this.listFilesEl.innerHTML = ""

            currentValues.forEach(cvalue =>{
                

                let key = cvalue.key
                let data = cvalue.val()
                
             
                if(data.type){

                    this.listFilesEl.appendChild(this.getFileView(data, key))

                }})})

       
    }   

    // menu de rotas para abertura de pastas = NAVEGAÇÃO DE PASTAS.
    renderNav(){

        let nav = document.createElement('nav')
        let path = []

        for(let i = 0; i < this.currentFolder.length; i++){

            let folderName = this.currentFolder[i]
            let span = document.createElement('span');
            path.push(folderName)

            if((i+1) === this.currentFolder.length){

                span.innerHTML = folderName

            }
            else{
                span.className = 'breadcrumb-segment__wrapper'
                span.innerHTML = `  <span class="ue-effect-container uee-BreadCrumbSegment-link-0">
                <a href="#" data-path="${path.join('/')}" class="breadcrumb-segment">${folderName}</a>
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
                <title>arrow-right</title>
                <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282"
                    fill-rule="evenodd"></path>
            </svg`
                
            
        }
        
        nav.appendChild(span)

        }
        this.navEl.innerHTML = nav.innerHTML

        this.navEl.querySelectorAll('a').forEach(a=>{

            a.addEventListener('click', e=>{

                e.preventDefault()

                this.currentFolder = a.dataset.path.split('/');

                this.openFolder()


            })


        })


        /*
            <span class="breadcrumb-segment__wrapper">

                                            <span class="ue-effect-container uee-BreadCrumbSegment-link-0">
                                                <a href="https://www.dropbox.com/work" class="breadcrumb-segment">HCODE</a>
                                            </span>

                                            


                                            <svg width="24" height="24" viewBox="0 0 24 24" class="mc-icon-template-stateless" style="top: 4px; position: relative;">
                                                <title>arrow-right</title>
                                                <path d="M10.414 7.05l4.95 4.95-4.95 4.95L9 15.534 12.536 12 9 8.464z" fill="#637282"
                                                    fill-rule="evenodd"></path>
                                            </svg>
                                            
                                        </span> */
    }

    openFolder(){
        
        //para de escutar pasta anterior p/ ouvir a seguinte pasta que foi aberta.
        if(this.lastFolder) this.getFirebaseRef(this.lastFolder).off('value')



        this.renderNav();
        this.readFiles()



    }


    // adicionando classes aos li dos arquivos.
    initEventsLi(li){

        //double click para abrir files ou folder
        li.addEventListener("dblclick", e=>{

            let file = JSON.parse(li.dataset.fileObj)
            
            switch(file.type){

                case "folder":
                    this.currentFolder.push(file.name)
                    this.openFolder();
                break;

                default:
                    console.log(file)
                    window.open(file.path);

            }

        })

        li.addEventListener('click', e =>{
            
            //fica ouvindo caso haja mudança nas seleções dos arquivos
           

         
            if(e.shiftKey){

                let firstLi = this.listFilesEl.querySelector(".selected");

                if(firstLi) {

                    
                    let indexStart;
                    let indexEnd;
                    let ulfilhos = li.parentElement.childNodes
                    
                   ulfilhos.forEach((el, index) =>{

                        if(firstLi === el) indexStart = index;
                        
                        if(li === el) indexEnd = index;
                        
                    })


                    let indexArray = [indexStart, indexEnd].sort()

                    ulfilhos.forEach((el, indexLi) =>{
                       
                        if(indexArray[1] >= indexLi && indexLi >= indexArray[0] ) {
                         
                            el.classList.add("selected")
                        }

                    })

                    this.listFilesEl.dispatchEvent(this.onselectionchange)

                    return true;
                }
    
            }
            

            if(!e.ctrlKey) {
                this.listFilesEl.querySelectorAll("li.selected").forEach(el => {
                    
                    el.classList.remove('selected');
                    
                })
                
            }
            
            li.classList.toggle('selected')

            this.listFilesEl.dispatchEvent(this.onselectionchange)

            
        } )

    }
}
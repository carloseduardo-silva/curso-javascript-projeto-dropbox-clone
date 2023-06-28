class DropBoxController {

    constructor(){
        this.btnSend = document.querySelector("#btn-send-file");

        this.InputFilesEl = document.querySelector("#files")

        this.snackModalEl = document.querySelector("#react-snackbar-root")



        this.initEvents();
    }


    initEvents(){
        this.btnSend.addEventListener("click", e => {
            
            this.InputFilesEl.click();

        })

        this.InputFilesEl.addEventListener("change", event => {

            console.log(event.target.files)
            this.uploadTask(event.target.files)
            this.snackModalEl.style.display = "block";
        })

    }


    uploadTask(files){

        let promisses = []
        let fileArray = [...files]

        //receiving more than 1 file to upload, we will need put then in array and use a foreach to atributte a promisse for each one of these files, looking if then was resolved(loaded + parse(ajax.responsetext)) or rejected (no loaded and has a error.) 

    
        fileArray.forEach(file => {

            promisses.push(new Promise((resolve, reject) =>{

                let ajax = new XMLHttpRequest();

                ajax.open("POST", "/upload")

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

                let formData = new FormData();

                formData.append("input-file", file)

                ajax.send(formData)

            }))
            
        });

        return Promise.all(promisses)
        
        
    }





}
global.fetch = require("node-fetch");

var use_backuend_url = process.env.APP_USE_DATAHUB === "true" ? true : false

var get_backend_port = process.env.APP_BACKEND_PORT === undefined ? "3001" : process.env.APP_BACKEND_PORT
var backend_url = process.env.APP_DATHUB === undefined ? "http://localhost:" + get_backend_port : process.env.APP_DATHUB

console.log("datahub url:     " + backend_url + "/internal/add")
console.log("datahub enabled: " + use_backuend_url)

const sendHeat = (jsondaata) => {
    if (!use_backuend_url){
        console.log('datahub is off')
    }
    if (use_backuend_url) {
        console.log('sendheat to ' + backend_url + '/internal/add')
        let responsedata = "OK"

        console.log(JSON.stringify(jsondaata))

        fetch(backend_url + '/internal/add', {
            method: 'POST', // or 'PUT'
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            cache: 'no-cache',
            body: JSON.stringify(jsondaata)
        })
            .then(response => {
                responsedata = response;
                return response
            })
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
                console.log('jsondaata: ');
                console.log(JSON.stringify(jsondaata))
                console.log('responsedata: ');
                console.log(responsedata)
            });
    }
}

exports.sendHeat = sendHeat;
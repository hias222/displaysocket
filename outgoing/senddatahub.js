global.fetch = require("node-fetch");

var get_backend_port = process.env.REACT_APP_BACKEND_PORT === undefined ? "3000" : process.env.REACT_APP_BACKEND_PORT
var get_backend_url = process.env.REACT_APP_BACKEND_DIRECT === "true" ? "http://localhost:" + get_backend_port : process.env.REACT_APP_DATHUB
var backend_url = get_backend_url === undefined ? "http://localhost:" + get_backend_port : get_backend_url


const sendHeat = (jsondaata) => {
    console.log('sendheat to ' + backend_url +  '/api/heat/add')
    let responsedata = "OK"

    console.log(JSON.stringify(jsondaata))

    fetch(backend_url + '/api/heat/add', {
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

exports.sendHeat = sendHeat;
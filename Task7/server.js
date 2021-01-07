const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const clarifai = require('clarifai');
const fetch = require('node-fetch');

const envFilePath = path.resolve(__dirname, './.env');
const env = require("dotenv").config({ path: envFilePath });
if (env.error) {
  throw new Error(`Unable to load the .env file.`);
}

const clarifaiApp = new clarifai.App({
    apiKey: process.env.CLARIFAI_API_KEY
});

app.use(express.json({limit: '50mb'}));
app.use(express.static(process.env.STATIC_DIR));


// default URL for website
app.get('/', function (req, res) {
    const filePath = path.resolve(__dirname + "/src/index.html");
    res.sendFile(filePath);
});

//Route that will add receipt image urls from cloudinary
app.post('/insertInputs', function (req, res) {
    const inputArray = createInputArray();
    clarifaiApp.inputs
        .create(inputArray)
        .then(
            function (response) {
                res.status(200).send(response);
            },
            function (err) {
                res.status(400).send(err);
            },
        );
});

app.post('/getPrediction', function (req, res) {
    clarifaiApp.models
        .initModel({
            id: process.env.MODEL_ID,
            version: process.env.MODEL_VERSION,
        })
        .then((model) => {
            return model.predict(req.body.image);
        })
        .then(
            function (response) {
                let concepts = response['outputs'][0]['data']['concepts'];
                if (concepts[0].value > 0.7) {
                    return res.status(200).send({
                        isReceipt: true,
                        score: concepts[0].value
                    });
                } else {
                    return res.status(200).send({
                        isReceipt: false,
                        score: concepts[0].value
                    });
                };
            },
            function (error) {
                console.log(error);
                return res.status(400).send({
                    error: {
                        message: 'There seems to be an error with the Clarifai API. Please try again later.',
                    }
                });
            }
        );
});

app.post('/insertNewInput', function(req, res){
    clarifaiApp.inputs
    .create({
        base64:req.body.image,
        concepts: [
            {
                id: 'receipt',
                value: true,
            },
        ],
    })
    .then(
        function (response) {
            return res.status(200).send({
                success: {
                    message: 'Successfully uploaded.',
                }
            });
        },
        function (err) {
            return res.status(400).send({
                error: {
                    message: 'There seems to be an error with the Clarifai API. Please try again later.',
                }
            });
        }
    )
});

app.post('/useVisualTextRecognition', function(req, res){
    var passTotal = false;
    clarifaiApp.workflow
    .predict(process.env.WORKFLOW_ID, { base64: req.body.image }).then(
        function (response) {
            console.log(response.results[0].outputs[3].data.text);
            let data = response.results[0].outputs[3].data.text;
            //boolean to indicate whether the letters total have passed while parsing through
            return res.status(200).send({
                success: {
                    message: 'Successfully uploaded.',
                    response: data
                }
            });
        },
        function (err) {
            return res.status(400).send({
                error: {
                    message: 'There seems to be an error with the Clarifai Workflow API. Please try again later.',
                }
            });
        },
    );
})

app.post('/findTotalAmount', async function(req, res){    
    const response = await fetch(process.env.TAGGUN_API_LINK, {
        headers: {
            accept: "application/json",
            apikey: process.env.TAGGUN_API_KEY,
          },
          method: "POST",
          body:  JSON.stringify({
              image: req.body.image,
              filename: req.body.name,
              contentType: req.body.type
          }),
    });
    var result = await response.json();
    console.log(result);
    if(result.statusCode){
        return res.status(result.statusCode).send({
            error: {
                message: "There seems to be something wrong with the Taggun API, please try again later.",
            }
        });
    }else{
        return res.status(200).send({
            data: result
        });
    }
    
});

function createInputArray(){
    var inputs = [];
    var startImageNumber = 1000;
    const totalReceipts = parseInt(process.env.NUM_OF_RECEIPTS);
    for(var i = 0; i < totalReceipts; i++){
        var imgNo = startImageNumber + i;
        inputs.push({
            url:`${process.env.RECEIPT_URL}${imgNo}-receipt.jpg`,
            concepts: [
                {
                    id: 'receipt',
                    value: true,
                },
            ],
        });
    }
    return inputs;
}

const server = http.createServer(app);
const port = 5000;
server.listen(port);
console.debug('Server listening on port ' + port);


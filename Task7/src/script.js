const chooseFileBtn = document.getElementById('choose-file-button');
const fileChosenText = document.getElementById('file-chosen-text');
const predictBtn = document.getElementById('predict');
const findTotalBtn = document.getElementById('totalAmt');
var image;

// If a fetch error occurs, log it to the console and show it in the UI.
var handleFetchResult = function(result) {
    if (!result.ok) {
      return result.json().then(function(json) {
        if (json.error && json.error.message) {
          throw new Error(result.url + ' ' + result.status + ' ' + json.error.message);
        }
      }).catch(function(err) {
        showMessage(err);
        throw err;
      });
    }
    return result.json();
  };

var showMessage = function (message) {
    var messageEl = document.getElementById("message-container")
    messageEl.textContent = message;
    messageEl.style.display = "block";
};

function showLoader(){
    document.getElementById("loading-overlay").style.display = "block";
}

function hideLoader(){
    document.getElementById("loading-overlay").style.display = "none";
}

function validateFile(file){
    var message = "";
    if(!file){
        message="This image you are trying to upload does not seem to exist. Please try uploading an image again."
        return message;
    }

    const validImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/svg'];
    if(!validImageTypes.includes(file.type)){
        message="Unsupported file type! Please try uploading a gif, jpeg, png or svg file."
        return message;
    }

    //empty message if it is all valid
    return message;
}

chooseFileBtn.addEventListener('change', function() {
    document.getElementById("message-container").style.display = "none";
    fileChosenText.textContent = this.files[0].name;
    var errMsg = validateFile(this.files[0]);
    if(errMsg === ""){
        var reader = new FileReader();

        reader.onload = (e) => {
            document.getElementById('image-overlay').style.display = "none";
            document.getElementById('preview-img').src = e.target.result;
            image = e.target.result.replace(/^data:image\/(.*);base64,/, '');
        }

        reader.readAsDataURL(this.files[0]);
    }else{
        showMessage(errMsg);
    }
});

predictBtn.onclick = (e) =>{
    document.getElementById('loader-text').innerHTML = 'Predicting.....';
    showLoader();
    var file = document.querySelector('input[type=file]').files[0];
    if(!file){
        hideLoader();
        showMessage('Please upload a file first!');
    }else{
        fetch("/getPrediction",{
            method:'POST',
            headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                image: image
              }) 
        })
        .then(handleFetchResult)
        .then(function (json) {
            var isReceipt = json.isReceipt;
            var score = json.score;
            var resultMsg = isReceipt ? 
            `<br /> Your image is most likely a receipt! This output is ${score*100}% accurate.`
            :
            `<br /> Oops. Your image is most likely NOT a receipt. This output is ${score*100}% accurate.`;
            
            document.getElementById("results-section").style.display = "block";
            document.getElementById("results-container").innerHTML += "<br />" + resultMsg + "<br />";
            
            if (isReceipt) {
                fetch("/insertNewInput", {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        image: image
                    })
                })
                    .then(handleFetchResult)
                    .then(function (json) {
                        hideLoader();
                    });
            }else{
                hideLoader();
            }
        })
    }
}



findTotalBtn.onclick = (e) => {
    document.getElementById('loader-text').innerHTML = 'Finding the total amount.....';
    showLoader();
    var file = document.querySelector('input[type=file]').files[0];
    if (!file) {
        hideLoader();
        showMessage('Please upload a file first!');
    } else {
        fetch("/findTotalAmount", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image: image,
                name: file.name,
                type: file.type
            })
        })
            .then(handleFetchResult)
            .then(function (json) {
                document.getElementById("results-section").style.display = "block";
                document.getElementById("results-container").innerHTML += "<br />" 
                + `The total amount on the receipt is $${json.data.totalAmount.data}. This output is about ${json.data.totalAmount.confidenceLevel * 100}% accurate. `;
                hideLoader();
            });
    }
}

document.getElementById("message-container").onclick = (e) =>{
    document.getElementById("message-container").style.display = "none";
}

document.getElementById("removeFile").onclick = (e) =>{
    var file = document.querySelector('input[type=file]').files[0];
    if (!file) {
        showMessage('Please upload a file first!');
    } else {
        document.querySelector('input[type=file]').value ="";
        document.getElementById('image-overlay').style.display = "block";
            document.getElementById('preview-img').src = "";
    }
}
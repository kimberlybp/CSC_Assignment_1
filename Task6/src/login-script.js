// If a fetch error occurs, log it to the console and show it in the UI.
var handleFetchResult = function (result) {
    if (!result.ok) {
        return result.json().then(function (json) {
            if (json.error && json.error.message) {
                throw new Error(result.url + ' ' + result.status + ' ' + json.error.message);
            }
        }).catch(function (err) {
            showErrorMessage(err);
            throw err;
        });
    }
    return result.json();
};

var showErrorMessage = function (message) {
    var errorEl = document.getElementById("error-message")
    errorEl.textContent = message;
    errorEl.style.display = "block";
};

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('LogOutSuccess') == 'true') {
    showErrorMessage('Logged out successfully!')
}
document
    .getElementById("form")
    .addEventListener("submit", function (evt) {
        evt.preventDefault();
        document.getElementById("loading-overlay").style.display = "block";
        fetch("/loginToFirebase", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: document.getElementById("email").value,
                password: document.getElementById("password").value,
            })
        }).then(handleFetchResult)
            .then(function (json) {
                window.location.href = "/choose"
            });
    });

document
    .getElementById("guest-form")
    .addEventListener("submit", function (evt) {
        evt.preventDefault();
        document.getElementById("loading-overlay").style.display = "block";
        fetch("/signInAnon", {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        }).then(handleFetchResult)
        .then(function(json) {
            window.location.href = "/choose"
        });

    });

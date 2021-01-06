document.getElementById("loading-overlay").style.display = "block";
// If a fetch error occurs, log it to the console and show it in the UI.
var handleFetchResult = function(result) {
  if (!result.ok) {
    return result.json().then(function(json) {
      if (json.error && json.error.message) {
        throw new Error(result.url + ' ' + result.status + ' ' + json.error.message);
      }
    }).catch(function(err) {
      showErrorMessage(err);
      throw err;
    });
  }
  return result.json();
};

// Create a Checkout Session with the selected plan ID
var createCheckoutSession = function(priceId, customerId) {
  return fetch("/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      priceId: priceId,
      customerId: customerId
    })
  }).then(handleFetchResult);
};

// Handle any errors returned from Checkout
var handleResult = function(result) {
  if (result.error) {
    showErrorMessage(result.error.message);
  }
};

var showErrorMessage = function(message) {
  var errorEl = document.getElementById("error-message")
  errorEl.textContent = message;
  errorEl.style.display = "block";
};

/* Get your Stripe publishable key to initialize Stripe.js */
fetch("/setup")
  .then(handleFetchResult)
  .then(function(json) {
    var publishableKey = json.publishableKey;
    var starterPriceId = json.starterPrice;
    var basicPriceId = json.basicPrice;
    var premiumPriceId = json.premiumPrice;
    var customerId = json.customer_id;
    var customerEmail = json.customer_email;

    var stripe = Stripe(publishableKey);
    // Setup event handler to create a Checkout Session when button is clicked
    document
      .getElementById("starter-plan-btn")
      .addEventListener("click", function(evt) {
        document.getElementById("loading-overlay").style.display = "block";
        createCheckoutSession(starterPriceId, customerId).then(function(data) {
          // Call Stripe.js method to redirect to the new Checkout page
          stripe
            .redirectToCheckout({
              sessionId: data.sessionId
            })
            .then(handleResult);
        });
      });

    // Setup event handler to create a Checkout Session when button is clicked
    document
      .getElementById("basic-plan-btn")
      .addEventListener("click", function(evt) {
        document.getElementById("loading-overlay").style.display = "block";
        createCheckoutSession(basicPriceId, customerId).then(function(data) {
          // Call Stripe.js method to redirect to the new Checkout page
          stripe
            .redirectToCheckout({
              sessionId: data.sessionId
            })
            .then(handleResult);
        });
      });

    // Setup event handler to create a Checkout Session when button is clicked
    document
      .getElementById("premium-plan-btn")
      .addEventListener("click", function(evt) {
        document.getElementById("loading-overlay").style.display = "block";
        createCheckoutSession(premiumPriceId, customerId).then(function(data) {
          // Call Stripe.js method to redirect to the new Checkout page
          stripe
            .redirectToCheckout({
              sessionId: data.sessionId
            })
            .then(handleResult);
        });
      });

    if (customerEmail) {
      document
        .getElementById('welcome')
        .innerHTML = 'Welcome ' + customerEmail + '!';
    }else{
      document
        .getElementById('welcome')
        .innerHTML = 'Welcome guest user!';
      document
        .getElementById('logout')
        .innerHTML = 'Back to Login';
    }
    

    document
      .getElementById('logout')
      .addEventListener("click", function (evt) {
        document.getElementById("loading-overlay").style.display = "block";
        fetch('/logOut', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        .then(handleFetchResult)
        .then((data) => {
          customerEmail ? 
          window.location.href = data.url + "?LogOutSuccess=true"
          :
          window.location.href = data.url
        });
      });

      const manageBillingForm = document.querySelector('#manage-billing-form');
      manageBillingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        document.getElementById("loading-overlay").style.display = "block";
        fetch('/customer-portal-byId', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerId: customerId
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            window.location.href = data.url;
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      });

      if(customerId == null){
        document.getElementById('manage').disabled = true;
      }

      document.getElementById("loading-overlay").style.display = "none";
  });

 
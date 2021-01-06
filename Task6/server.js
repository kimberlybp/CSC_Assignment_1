const http = require('http');
const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const firebase = require('firebase');

const envFilePath = path.resolve(__dirname, './.env');
const env = require("dotenv").config({ path: envFilePath });
if (env.error) {
  throw new Error(`Unable to load the .env file.`);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.use(bodyParser.json({
  // Because Stripe needs the raw body, we compute it but only when hitting the Stripe callback URL.
  verify: function(req,res,buf) {
      var url = req.originalUrl;
      if (url.startsWith('/webhook')) {
          req.rawBody = buf.toString()
      }
  }}));
app.use(express.static("./src"));

//Default URL 
app.get('/', function (req, res) {
    const filePath = path.resolve(__dirname + "/src/index.html");
    res.sendFile(filePath);
});

app.get("/setup", (req, res) => {
    res.send({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      starterPrice: process.env.STARTER_PRICE_ID,
      basicPrice: process.env.BASIC_PRICE_ID,
      premiumPrice: process.env.PREMIUM_PRICE_ID,
    });
  });

  // Fetch the Checkout Session to display the JSON result on the success page
app.get("/checkout-session", async (req, res) => {
    const { sessionId } = req.query;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.send(session);
  });
  
  app.post("/create-checkout-session", async (req, res) => {
    const domainURL = process.env.DOMAIN;
    const { priceId } = req.body;
  
    // Create new Checkout Session for the order
    // Other optional params include:
    // [billing_address_collection] - to display billing address details on the page
    // [customer] - if you have an existing Stripe Customer ID
    // [customer_email] - lets you prefill the email input in the form
    // For full details see https://stripe.com/docs/api/checkout/sessions/create
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // ?session_id={CHECKOUT_SESSION_ID} means the redirect will have the session ID set as a query param
        success_url: `${domainURL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domainURL}/canceled.html`,
      });
  
      res.send({
        sessionId: session.id,
      });
    } catch (e) {
      res.status(400);
      return res.send({
        error: {
          message: e.message,
        }
      });
    }
  });  

app.post('/customer-portal', async (req, res) => {
   // For demonstration purposes, we're using the Checkout session to retrieve the customer ID. 
  // Typically this is stored alongside the authenticated user in your database.
  const { sessionId } = req.body;
  const checkoutsession = await stripe.checkout.sessions.retrieve(sessionId);

  // This is the url to which the customer will be redirected when they are done
  // managing their billing with the portal.
  const returnUrl = process.env.DOMAIN;

  const portalsession = await stripe.billingPortal.sessions.create({
    customer: checkoutsession.customer,
    return_url: returnUrl,
  });

  res.send({
    url: portalsession.url,
  });
});

// Match the raw body to content type application/json
app.post('/webhook', bodyParser.raw({ type: '*/*' }), (request, response) => {
  let event;

  const signature = request.headers['stripe-signature'];

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    // https://stripe.com/docs/billing/subscriptions/overview#subscription-events
    // Handle the event
    switch (event.type) {
      //any changes to subscription such as upgrading or donwgrading to another plan
      case 'customer.subscription.updated':
        sendToDB(event.id, event.data.object.id, event.type, createDateTimeString(event.created), event.created);
        break;
      //if customer cancels subscription
      case 'customer.subscription.deleted':
        sendToDB(event.id, event.data.object.id, event.type, createDateTimeString(event.created), event.created);
        break;
      //occurs during successful charges 
      case 'invoice.paid':
        if (event.data.object.billing_reason.includes('subscription')) {
          sendToDB(event.id, event.data.object.id, event.type, createDateTimeString(event.created), event.created);
        }
        break;
      //occurs during failed charges
      case 'invoice.payment_failed':
        console.log(event.data.object.billing_reason);
        if (event.data.object.billing_reason.includes('subscription')) {
          sendToDB(event.id, event.data.object.id, event.type, createDateTimeString(event.created), event.created);
        }
        break;
      default:
        //console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }


});

  var firebaseConfig = {
    apiKey: "AIzaSyB7IaoQdnU5F80hh-JfyL548oRw3xB_ymk",
    authDomain: "csc-task6.firebaseapp.com",
    databaseURL: "https://csc-task6-default-rtdb.firebaseio.com",
    projectId: "csc-task6",
    storageBucket: "csc-task6.appspot.com",
    messagingSenderId: "90231069859",
    appId: "1:90231069859:web:4ddb58a8f9de85fa4cf316",
    measurementId: "G-0RZMLN361J"
  };

  firebase.initializeApp(firebaseConfig);
  let database = firebase.database();


function sendToDB(eventid, id, type, datetime, timestamp) {
    var obj = { 
        eventid: eventid,
        id: id,
        type: type,
        createdAt: datetime,
        timestamp: timestamp
    }

    var oneRow = database.ref("subscription-log").child(obj.id);

    oneRow.update (obj, (error) => {
        if (error) {
            // The write failed...
            console.log("Failed with error: " + error);
        } else {
            // The write was successful...
            console.log("success")
        }
    })

 }

 function createDateTimeString (timestamp){
  var date = new Date(timestamp*1000)
  var datetimeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  return datetimeString;
 }

const server = http.createServer(app);
const port = 3000;
server.listen(port);
console.debug('Server listening on port ' + port);
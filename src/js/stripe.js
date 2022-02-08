import 'regenerator-runtime/runtime';
import axios from 'axios';
const stripe = Stripe(
  'pk_test_51JZTWQSIUZLasS08a1DaAMFWRUXD9FvGT6Y0OkIaZwhnNVvrd9JsJ940equ3RQ1EWUyJ0yGoGZEcpnQPR9vP73R300uWPqJWYu'
);

// DOM Elements
const cardNumber = document.getElementById('card-number');
const cardExpiry = document.getElementById('card-expiry');
const cardCvc = document.getElementById('card-cvc');
const errorMsg = document.querySelector('.errorMsg');
const checkoutForm = document.querySelector('.checkout-form');
const pay = document.querySelector('.pay');
console.log(pay);

// Necessary Variables
let cardNumberElement;
let cardExpiryElement;
let cardCvcElement;
let cardErrorMsg;
let cardNumberComplete;
let cardExpiryComplete;
let cardCvcComplete;

// Execute Function
createStripeElements();

// Stripe Create Elements
function createStripeElements() {
  // If we want to use separate card elements, then first inilise stripe.elements() at first.
  const elements = stripe.elements();
  console.log(elements, 'elemets');
  const style = {
    base: {
      color: '#000000',
      // padding: '15px 20px',
      fontFamily:
        'Roboto,system,-apple-system,BlinkMacSystemFont,".SFNSDisplay-Regular","Helvetica Neue",Helvetica,Arial,sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '13px',
      letterSpacing: '8px',
      '::placeholder': {
        color: '#b0b0b0',
      },
    },
    invalid: {
      color: '#cc0000',
      iconColor: '#f8a3d4',
    },
  };
  // Creating elements
  cardNumberElement = elements.create('cardNumber', {
    style: style,
    showIcon: true,
  });
  cardExpiryElement = elements.create('cardExpiry');
  cardCvcElement = elements.create('cardCvc');
  // Mount Elements
  cardNumberElement.mount(cardNumber);
  cardExpiryElement.mount(cardExpiry);
  cardCvcElement.mount(cardCvc);

  console.log(cardNumberElement, 'cardNumberElement');

  // Error Handling
  cardNumberElement.addEventListener('change', (event) => {
    console.log(event);
    if (event.error) {
      cardErrorMsg = event.error.message;
      errorMsg.textContent = event.error.message;
      setTimeout(() => {
        errorMsg.textContent = '';
      }, 1000);
    }
    if (event.complete) {
      // enable payment button
      cardNumberComplete = true;
      errorMsg.textContent = '';
    }
  });
  cardExpiryElement.addEventListener('change', (event) => {
    console.log(event);
    if (event.error) {
      cardErrorMsg = event.error.message;
      errorMsg.textContent = event.error.message;
      setTimeout(() => {
        errorMsg.textContent = '';
      }, 1000);
    }
    if (event.complete) {
      cardExpiryComplete = true;
    }
  });
  cardCvcElement.addEventListener('change', (event) => {
    console.log(event);
    if (event.error) {
      cardErrorMsg = event.error.message;
      errorMsg.textContent = event.error.message;
      setTimeout(() => {
        errorMsg.textContent = '';
      }, 1000);
    }

    if (event.complete) {
      // enable payment button
      cardCvcComplete = true;
    }
  });
}

checkoutForm.addEventListener('submit', handlePaymentFlow);

/*
1.Add a card 
 1.Use SetupIntent - get client_secret token from setUp intent on server.
 2.confirmCardSetup - with that token with passing card detail.
*/

// Eg customer - jane - cus_KtFtQkayYIqMWK
async function handlePaymentFlow(e) {
  e.preventDefault();
  console.log('submitted');
  if (cardNumberComplete && cardExpiryComplete && cardCvcComplete) {
    // Call AddCard
    await addCard();
  } else {
    errorMsg.textContent = 'Please Update Card Details';
    setTimeout(() => {
      errorMsg.textContent = '';
    }, 1000);
  }
}

// Withcustomer anology  - 61d19cfee144e1bfcbe4446a - userID - user jane
//Get SetUpIntent client secret and add card
async function addCard() {
  try {
    //const userId = '61d19cfee144e1bfcbe4446a';
    const userId = '61d1b099cb78f9f25f2857b2';
    const { data } = await axios.get(
      `http://localhost:5050/api/v1/setup-intent/${userId}`
    );
    console.log(data, 'data check');
    // seti_1KIXVzSIUZLasS08kJySF8Jg_secret_KyUUKlij70bKNheq0Bzq7T38XwKzeW8;
    const { error, setupIntent } = await stripe.confirmCardSetup(
      data.client_secret,
      {
        payment_method: {
          card: cardNumberElement,
          billing_details: {
            name: 'Jane bella test ',
            address: {
              postal_code: '12345',
            },
          },
        },
      }
    );
    if (error) {
      errorMsg.textContent = error.message;
    }
    if (setupIntent) {
      // Update Customer default card as this paymentmethod - invoice setting
      let body = {
        invoice_settings: {
          default_payment_method: setupIntent.payment_method,
        },
      };
      const { data } = await axios.patch(
        `http://localhost:5050/api/v1/update-customer/${userId}`,
        body
      );
    }
    console.log(error, 'setUp error');
    console.log(setupIntent, 'setupIntent response');
    // Create Subscription
    await createSubscription(userId, setupIntent.payment_method);
  } catch (error) {
    console.log(error, 'api error check');
  }
}

async function createSubscription(userId, pm) {
  try {
    let priceId = 'price_1KIcL8SIUZLasS08u9VOUXFU';
    const { data } = await axios.post(
      `http://localhost:5050/api/v1/createSubscription/${userId}?priceId=${priceId}&paymentMethod=${pm}`
    );
    console.log(data, 'sub dat check');
  } catch (error) {
    console.log(error.message, 'from sub error');
  }
}
// price_1KIcL8SIUZLasS08u9VOUXFU;

const chat = document.getElementById("chat");
const msgs = document.getElementById("msgs");

/** All current messages */
let allChat = [];

/** the interval to poll at in milliseconds */
const INTERVAL = 3000;

const BACK_OFF = 5000;
let timeToMakeNextRequest = 0;
let failedTries;

// a submit listener on the form in the HTML
chat.addEventListener("submit", function (e) {
  e.preventDefault();
  postNewMessages(chat.elements.user.value, chat.elements.text.value);
  chat.elements.text.value = "";
});

async function postNewMessages(user, text) {
  const data = {
    user,
    text,
  };

  await fetch("/poll", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  });
}

async function getNewMessages() {
  let json;
  try {
    const res = await fetch("/poll");
    json = await res.json();

    if (res.status >= 400) {
      throw new Error("Request did not succeed:", res.status);
    }

    allChat = json.messages;
    render();
    failedTries = 0;
  } catch (error) {
    console.error(error);
    failedTries++;
  }
}

function render() {
  // as long as allChat is holding all current messages, this will render them
  // into the ui. yes, it's inefficient. yes, it's fine for this example
  const html = allChat.map(({ user, text, time, id }) =>
    template(user, text, time, id)
  );
  msgs.innerHTML = html.join("\n");
}

// given a user and a msg, it returns an HTML string to render to the UI
const template = (user, msg) =>
  `<li class="collection-item"><span class="badge">${user}</span>${msg}</li>`;

async function poll(time) {
  if (timeToMakeNextRequest <= time) {
    await getNewMessages();
    timeToMakeNextRequest = time + INTERVAL + failedTries * BACK_OFF;
  }

  requestAnimationFrame(poll);
}

requestAnimationFrame(poll);

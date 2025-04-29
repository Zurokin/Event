import "./styles.css";

let socket;
let currentUser;

document.getElementById("submit").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  if (!name) return;

  try {
    const res = await fetch("http://localhost:3000/new-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();

    if (res.ok) {
      currentUser = data.user;
      initChat();
    } else {
      document.getElementById("error").textContent = data.message;
    }
  } catch (e) {
    document.getElementById("error").textContent =
      "Ошибка подключения к серверу";
  }
});

function initChat() {
  document.getElementById("login").style.display = "none";
  document.getElementById("chat").style.display = "flex";

  socket = new WebSocket("ws://localhost:3000");

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (Array.isArray(data)) {
      updateUsersList(data);
    } else if (data.type === "send") {
      const chat = document.getElementById("messages");
      const el = document.createElement("div");
      el.classList.add(
        "message",
        data.user.name === currentUser.name ? "my-message" : "other-message"
      );

      const time = getCurrentTime();
      el.innerHTML = `
        <span class="username">${data.user.name}</span> 
        <span class="time">(${time})</span>: 
        ${data.message}
      `;

      chat.appendChild(el);
      chat.scrollTop = chat.scrollHeight;
    }
  };

  document.getElementById("msg").addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  document.getElementById("send-btn").addEventListener("click", () => {
    sendMessage();
  });

  window.addEventListener("beforeunload", () => {
    socket.send(
      JSON.stringify({
        type: "exit",
        user: currentUser,
      })
    );
  });
}

function sendMessage() {
  const msg = document.getElementById("msg").value.trim();
  if (!msg) return;

  const payload = {
    type: "send",
    user: currentUser,
    message: msg,
  };

  socket.send(JSON.stringify(payload));
  document.getElementById("msg").value = "";
}

function updateUsersList(users) {
  const userList = document.getElementById("userList");
  userList.innerHTML = "";
  users.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user.name === currentUser.name ? "You" : user.name;
    userList.appendChild(li);
  });
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

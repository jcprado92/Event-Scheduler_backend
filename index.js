//index.js
const { Novu, PushProviderIdEnum } = require("@novu/node");
const novu = new Novu("4bb026e43dae74766a33e26ec713fc24");
const express = require("express");
const app = express();
const PORT = 4000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//New imports
const http = require("http").Server(app);
const cors = require("cors");
app.use(cors());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let eventList = [];

async function sendNotification(message) {
    const subscriberId = "6383f02c15685362a325c9ec";
    await novu.subscribers.identify(subscriberId, {
        firstName: "John",
        lastName: "Prado",
    });
    await novu.subscribers.setCredentials(subscriberId, PushProviderIdEnum.FCM, {
        deviceTokens: ["ccYjMRosn_0Ii75pYvrKux:APA91bFbcVEEg3ILgDmiJtZiyN278m4aZqjohsn_v9MPsVn6susf2LShBQEUjqsz-aIdmHEe-YwoKIdKCH8dqd8MDvAx_FgmFZUWVwe3lXkQ8ZkPqMNu3tWuHG6hmPUjsF7nHHnPO66g"],
    });
    const trigger = await novu.trigger("on-boarding-notification", {
        to: {
            subscriberId,
        },
        /*👇🏻 payload allows you to pass data into the notification template
        Read more here: https://docs.novu.co/platform/templates/#variable-usage
        */
        payload: {
            message,
        },
    });
}

socketIO.on("connection", (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on("newEvent", (event) => {
        eventList.unshift(event);
        //sends the events back to the React app
        socket.emit("sendSchedules", eventList);
    });

    let interval = setInterval(function () {
        if (eventList.length > 0) {
            for (let i = 0; i < eventList.length; i++) {
                if (
                    Number(eventList[i].hour) === new Date().getHours() &&
                    Number(eventList[i].minute) === new Date().getMinutes() &&
                    new Date().getSeconds() === 0
                ) {
                    socket.emit("notification", {
                        title: eventList[i].title,
                        hour: eventList[i].hour,
                        mins: eventList[i].minute,
                    });
                }
            }
        }
    }, 1000);
    
    socket.on("disconnect", () => {
        console.log(`⚡: ${socket.id} user just disconnected!`);
        socket.disconnect();
    });
});

app.get("/api", async (req, res) => {
    const subscriberId = "6383f02c15685362a325c9ec";
    await novu.subscribers.identify(subscriberId, {
        firstName: "John",
        lastName: "Prado",
    });
    await novu.subscribers.setCredentials(subscriberId, PushProviderIdEnum.FCM, {
        deviceTokens: ["ccYjMRosn_0Ii75pYvrKux:APA91bFbcVEEg3ILgDmiJtZiyN278m4aZqjohsn_v9MPsVn6susf2LShBQEUjqsz-aIdmHEe-YwoKIdKCH8dqd8MDvAx_FgmFZUWVwe3lXkQ8ZkPqMNu3tWuHG6hmPUjsF7nHHnPO66g"],
    });
    const trigger = await novu.trigger("on-boarding-notification", {
        to: {
            subscriberId,
        },
    });
    res.json(trigger.data);
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
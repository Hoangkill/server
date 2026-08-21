const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.get("/", (req, res) => {
    res.send("Chess Server đang hoạt động!");
});

const rooms = {};

io.on("connection", (socket) => {
    console.log("Người chơi kết nối:", socket.id);

    socket.on("createRoom", (roomCode) => {

        if (rooms[roomCode]) {
            socket.emit("errorMessage", "Mã phòng đã tồn tại!");
            return;
        }

        rooms[roomCode] = {
            players: [socket.id]
        };

        socket.join(roomCode);
        socket.roomCode = roomCode;

        socket.emit("roomCreated", roomCode);

        console.log("Tạo phòng:", roomCode);
    });

    socket.on("joinRoom", (roomCode) => {

        const room = rooms[roomCode];

        if (!room) {
            socket.emit("errorMessage", "Không tìm thấy phòng!");
            return;
        }

        if (room.players.length >= 2) {
            socket.emit("errorMessage", "Phòng đã đủ 2 người!");
            return;
        }

        room.players.push(socket.id);

        socket.join(roomCode);
        socket.roomCode = roomCode;

        io.to(roomCode).emit("gameStart");

        console.log("Người chơi vào phòng:", roomCode);
    });

    socket.on("move", (move) => {

        if (!socket.roomCode) return;

        socket.to(socket.roomCode).emit(
            "opponentMove",
            move
        );
    });

    socket.on("disconnect", () => {

        const roomCode = socket.roomCode;

        if (!roomCode || !rooms[roomCode]) {
            return;
        }

        rooms[roomCode].players =
            rooms[roomCode].players.filter(
                id => id !== socket.id
            );

        if (rooms[roomCode].players.length === 0) {
            delete rooms[roomCode];
        }

        console.log("Người chơi thoát:", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server chạy tại port ${PORT}`);
});

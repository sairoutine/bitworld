'use strict';
var Game = require('./game');

var game;

window.onload = function() {
	// Canvas
	var mainCanvas = document.getElementById('mainCanvas');
	// Game オブジェクト
	game = new Game(mainCanvas);

	// イベントハンドラの設定
	game.setupEvents();

	// 初期化
	game.init();

	// ゲーム起動
	game.startRun();
};
window.onerror = function (msg, file, line, column, err) {
	/*
	msg: error message
	file: file path
	line: row number
	column: column number
	err: error object
	*/ 
	//window.alert(msg + "\n" + line + ":" + column);
};
/*
window.runGame = function () {
	game.startRun();
};
window.stopGame = function () {
	game.stopRun();
};
*/
window.changeFullScreen = function () {
	game.fullscreen();
};

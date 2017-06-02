'use strict';

// [x, y, z]
// x: 画面右
// y: 画面奥
// x: 画面上

/*
 * TODO
 * WebGL API の調査
 * シェーダーの調査
 * テクスチャの貼り付け方

 * setlightuniforms リファクタ
 * 設計方針固める
 */

// utils
function centerXY(pos) {
	return [pos[0]+0.5, pos[1]+0.5, pos[2]];
}




var base_scene = require('../hakurei').scene.base;
var CONSTANT = require('../hakurei').constant;
var util = require('../hakurei').util;
var AssetsConfig = require('../assets_config');
var TextureAtlas = require('../texture');
var Terrain = require('../terrain');
var Camera = require('../camera');
var Level = require('../level');
var PointLight = require('../point_light');
var Sprites = require('../sprites');
var DungeonConvert = require('../dungeon_convert');
var createData = require('../programs');
var glmat = require('gl-matrix');

var SceneLoading = function(core) {
	base_scene.apply(this, arguments);
};
util.inherit(SceneLoading, base_scene);

SceneLoading.prototype.init = function() {
	base_scene.prototype.init.apply(this, arguments);

	// create and enable shaders
	this.data = createData(this.core.gl);
	this.core.gl.enable(this.core.gl.DEPTH_TEST);
	this.core.gl.depthFunc(this.core.gl.LEQUAL);

	var land    = new TextureAtlas(this.core.gl, this.core.image_loader.getImage("ldfaithful"), 8);
	var sprites = new TextureAtlas(this.core.gl, this.core.image_loader.getImage("oryx"), 8);

	// 地形
	this.terrain = new Terrain(this.core.gl, land);
	// カメラ
	this.camera = new Camera();

	// レベル
	this.levelNum = 0; // 1~8
	this.level = null;

	// ライト一覧
	this.lights = [];
	// プレイヤーを照らすライト
	this.lights[0] = new PointLight([1.0, 0.5, 0.0], [0,0,1], [0.3, 0.1, 0.05]);


	this.sprites = new Sprites(this.core.gl, sprites);
	this.sprites.addSprite(Math.floor(Math.random()*256), [0,0,0]);

	// プレイヤー
	this.player = this.sprites.sprites[0];

	// (恐らく)プレイヤーについてくるやつ
	this.sprites.addSprite(Math.floor(Math.random()*256), [0,0,1]);

	this.sprites.sprites[1].maxSpeed *= 0.8;

	// 最初のステージへ
	this.goToLevel(this.levelNum);
};

SceneLoading.prototype.goToLevel = function(l) {
	this.level = Level.getLevel(l);
	this.dungeonObj = new DungeonConvert(this.level);

	// スタート地点を照らすライト
	this.lights[1] = new PointLight([1.0, 0.5, 0.0], centerXY(this.dungeonObj.upstairs), [0.2, 0.1, 0.05]);
	this.terrain.generate(this.dungeonObj.cubes);

	// キャラのポジション設定をスタート地点に
	this.player.pos = centerXY(this.dungeonObj.upstairs);
	// キャラについてくるやつのポジションをスタート地点に
	this.sprites.sprites[1].pos = centerXY(this.dungeonObj.upstairs);
	this.sprites.update();
};



SceneLoading.prototype.beforeDraw = function() {
	base_scene.prototype.beforeDraw.apply(this, arguments);

	// 入力に応じて操作
	this.handleInputs();
};
SceneLoading.prototype.draw = function(){
	// 画面をクリア
	this.core.gl.clearColor.apply(this.core.gl,this.data.background);
	// canvasを初期化する際の深度を設定する
	this.core.gl.clearDepth(1.0);
	this.core.gl.clear(this.core.gl.COLOR_BUFFER_BIT|this.core.gl.DEPTH_BUFFER_BIT); // 画面上の色をクリア + 深度バッファクリア

	this.core.gl.viewport(0, 0, this.core.width, this.core.height);
	glmat.mat4.perspective(this.data.world.m.pMatrix, 45.0, this.core.width/this.core.height, 0.1, 100.0);


	// ライトはプレイヤーの今いる位置を照らす
	this.lights[0].position = this.player.pos.slice(0);
	this.lights[0].position[2] += 2; // ライトのZ 軸を少し上に

	// ついてくるキャラを、プレイヤーの方に向けて動かす
	this.sprites.sprites[1].moveToward(this.terrain, this.player.pos);

	this.camera.moveCenter(this.player.pos, [0.0, 0.0, 0.5]);
	this.camera.updateMatrix(this.terrain.cubes);

	this.checkStairs();

	// MEMO: renderworld と rendersprites どちらを先に呼び出してもよい
	this.renderWorld();
	this.renderSprites();

	// 19: 描画
	this.core.gl.flush();
};

SceneLoading.prototype.renderWorld = function(){
	this.core.gl.enable(this.core.gl.CULL_FACE);
	this.core.gl.cullFace(this.core.gl.BACK);

	// 15. プログラムオブジェクトを有効にする
	this.core.gl.useProgram(this.data.world.program);
	this.data.world.m.vMatrix = this.camera.matrix;

	// 16. uniform 変数にデータを登録する
	// uniform -> 頂点ごとに一律で渡されるデータ。4fv -> vec4, 3fv -> vec3
	this.core.gl.uniformMatrix4fv(this.data.world.u.MMatrix, false, this.data.world.m.mMatrix);
	this.core.gl.uniformMatrix4fv(this.data.world.u.VMatrix, false, this.data.world.m.vMatrix);
	this.core.gl.uniformMatrix4fv(this.data.world.u.PMatrix, false, this.data.world.m.pMatrix);

	this.core.gl.uniform3fv(this.data.world.u.AmbientColor, this.level.ambient);

	this.updateLights(this.data.world);

	// attribute 変数にデータを登録する
	this.attribSetup(this.data.world.a.Position, this.terrain.vertexObject, 3);
	this.attribSetup(this.data.world.a.Texture, this.terrain.texCoordObject, 2);
	this.attribSetup(this.data.world.a.Normal, this.terrain.normalObject, 3);

	// 20. 有効にするテクスチャユニットを指定(今回は0)
	this.core.gl.activeTexture(this.core.gl.TEXTURE0);
	// 21. テクスチャをバインドする
	this.core.gl.bindTexture(this.core.gl.TEXTURE_2D, this.terrain.textureAtlas.texture);
	// 22. テクスチャデータをシェーダに送る(ユニット 0)
	this.core.gl.uniform1i(this.data.world.u.Sampler, 0);

	this.core.gl.bindBuffer(this.core.gl.ELEMENT_ARRAY_BUFFER, this.terrain.indexObject);
	this.core.gl.drawElements(this.core.gl.TRIANGLES, this.terrain.numVertices(), this.core.gl.UNSIGNED_SHORT, 0);
};

SceneLoading.prototype.updateLights = function(program){
	for (var i=0; i<this.lights.length; i++) {
		this.lights[i].update();
		this.core.gl.uniform1f(program.u.Light[i].enabled, this.lights[i].enabled);
		this.core.gl.uniform3fv(program.u.Light[i].attenuation, this.lights[i].attenuation);
		this.core.gl.uniform3fv(program.u.Light[i].color, this.lights[i].color);
		this.core.gl.uniform3fv(program.u.Light[i].position, this.lights[i].position);
	}
};

// attribute -> 頂点ごとに異なるデータ
SceneLoading.prototype.attribSetup = function(attrib, object, size, type) {
	if (!type)
		type = this.core.gl.FLOAT;

	// 17. attribute 属性を有効にする
	this.core.gl.enableVertexAttribArray(attrib);

	// 18. 頂点バッファをバインドする
	this.core.gl.bindBuffer(this.core.gl.ARRAY_BUFFER, object);
	// 19. attribute 属性を登録する(1頂点の要素数、型を登録)
	this.core.gl.vertexAttribPointer(attrib, size, type, false, 0, 0);
};

SceneLoading.prototype.renderSprites = function() {
	this.core.gl.disable(this.core.gl.CULL_FACE);

	// 15. プログラムオブジェクトを有効にする
	this.core.gl.useProgram(this.data.sprites.program);
	this.data.world.m.vMatrix = this.camera.matrix;

	this.sprites.sprites[0].theta = this.camera.theta[2];
	this.sprites.update();

	// 16. uniform 変数にデータを登録する
	// uniform -> 頂点ごとに一律で渡されるデータ。4fv -> vec4, 3fv -> vec3, 1f -> float
	this.core.gl.uniformMatrix4fv(this.data.sprites.u.MMatrix, false, this.data.world.m.mMatrix);
	this.core.gl.uniformMatrix4fv(this.data.sprites.u.VMatrix, false, this.data.world.m.vMatrix);
	this.core.gl.uniformMatrix4fv(this.data.sprites.u.PMatrix, false, this.data.world.m.pMatrix);

	this.core.gl.uniform1f(this.data.sprites.u.Counter, this.frame_count);
	this.core.gl.uniform3fv(this.data.sprites.u.AmbientColor, this.level.ambient);
	this.core.gl.uniform3fv(this.data.sprites.u.CamPos, this.camera.pos);

	this.updateLights(this.data.sprites);

	// attribute 変数にデータを登録する
	this.attribSetup(this.data.sprites.a.Position, this.sprites.vertexObject, 3);
	this.attribSetup(this.data.sprites.a.Texture, this.sprites.texCoordObject, 2);
	this.attribSetup(this.data.sprites.a.Offset, this.sprites.offsetObject, 3);
	this.attribSetup(this.data.sprites.a.Moving, this.sprites.movingObject, 1);
	this.attribSetup(this.data.sprites.a.Flipped, this.sprites.flippedObject, 1);

	// 20. 有効にするテクスチャユニットを指定(今回は0)
	this.core.gl.activeTexture(this.core.gl.TEXTURE0);
	// 21. テクスチャをバインドする
	this.core.gl.bindTexture(this.core.gl.TEXTURE_2D, this.sprites.textureAtlas.texture);
	// 22. テクスチャデータをシェーダに送る(ユニット 0)
	this.core.gl.uniform1i(this.data.sprites.u.Sampler, 0);

	this.core.gl.bindBuffer(this.core.gl.ELEMENT_ARRAY_BUFFER, this.sprites.indexObject);
	this.core.gl.drawElements(this.core.gl.TRIANGLES, this.sprites.numVertices(), this.core.gl.UNSIGNED_SHORT, 0);
};

SceneLoading.prototype.checkStairs = function() {
	var cubePos = [0,0,0];
	for (var i=0; i<3; i++) {
		cubePos[i] = Math.floor(this.sprites.sprites[1].pos[i]); // プレイヤーについてくるやつの位置
	}

	// プレイヤーについてくるやつと、ゴールのコリジョン判定
	if (cubePos[0] === this.dungeonObj.downstairs[0] && 
		cubePos[1] === this.dungeonObj.downstairs[1]) {
		this.goToLevel(++this.levelNum); // 次のステージへ
	}
};

SceneLoading.prototype.handleInputs = function() {
	if(this.core.isKeyDown(CONSTANT.BUTTON_UP) && this.core.isKeyDown(CONSTANT.BUTTON_LEFT)) {
		this.player.flipped = 1;
		this.player.turnAndMove(this.terrain, Math.PI/4);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_DOWN) && this.core.isKeyDown(CONSTANT.BUTTON_LEFT)) {
		this.player.flipped = 1;
		this.player.turnAndMove(this.terrain, 3/4*Math.PI);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_UP) && this.core.isKeyDown(CONSTANT.BUTTON_RIGHT)) {
		this.player.flipped = 0;
		this.player.turnAndMove(this.terrain,-Math.PI/4);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_DOWN) && this.core.isKeyDown(CONSTANT.BUTTON_RIGHT)) {
		this.player.flipped = 0;
		this.player.turnAndMove(this.terrain, 5/4*Math.PI);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_UP)) {
		this.player.turnAndMove(this.terrain, 0);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_LEFT)) {
		this.player.flipped = 1;
		this.player.turnAndMove(this.terrain, Math.PI/2);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_DOWN)) {
		this.player.turnAndMove(this.terrain, Math.PI);
	}
	else if(this.core.isKeyDown(CONSTANT.BUTTON_RIGHT)) {
		this.player.flipped = 0;
		this.player.turnAndMove(this.terrain,-Math.PI/2);
	}

	// カメラ移動
	if (this.core.isLeftClickDown()) {
		var angleChange = [
			-this.core.mouseMoveY() * this.data.rotateSpeed,
			0,
			this.core.mouseMoveX() * this.data.rotateSpeed
		];
		this.camera.changeAngle(angleChange);
	}

	// ズーム
	if (this.core.mouseScroll()) {
		this.camera.changeDistance(this.core.mouseScroll());
	}
};
module.exports = SceneLoading;

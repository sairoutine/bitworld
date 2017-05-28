'use strict';

/*
 * TODO
 * 右クリックカメラ移動や、ズーム対応
 * createData →リファクタ
 * 各種オブジェクトのリファクタ
  sprite.js
  sprites.js
  terrain.js
  camera.js
  point_light.js
  programs.js
  data.js
  level.js
  dungeon.js
  dungeon_convert.js
  * WebGL API の調査
  * シェーダーの調査
  scene/stage.js
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
var createData = require('../data');
var glmat = require('gl-matrix');

var SceneLoading = function(core) {
	base_scene.apply(this, arguments);
};
util.inherit(SceneLoading, base_scene);

SceneLoading.prototype.init = function() {
	base_scene.prototype.init.apply(this, arguments);

	this.data = createData(this.core.gl);

	var land    = new TextureAtlas(this.core.gl, this.core.image_loader.getImage("ldfaithful"), 8);
	var sprites = new TextureAtlas(this.core.gl, this.core.image_loader.getImage("oryx"), 8);

	// 地形
	this.terrain = new Terrain(this.core.gl, land);
	// カメラ
	this.camera = new Camera();

	// レベル
	this.levelNum = 0; // 1~8
	this.level = Level.getLevel(this.levelNum); // TODO: gotolevel 内でやっているので不要では

	// ライト一覧
	this.lights = [];
	// (恐らく)スタート地点のライト
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

	// ゴールを照らすライト
	this.lights[1] = new PointLight([1.0, 0.5, 0.0], centerXY(this.dungeonObj.upstairs), [0.2, 0.1, 0.05]);
	this.terrain.generate(this.dungeonObj.cubes);

	this.player.pos = centerXY(this.dungeonObj.upstairs);
	this.sprites.sprites[1].pos = centerXY(this.dungeonObj.upstairs);
	this.sprites.update();
};



SceneLoading.prototype.beforeDraw = function() {
	base_scene.prototype.beforeDraw.apply(this, arguments);

};
SceneLoading.prototype.draw = function(){
	this.core.gl.clearColor.apply(this,this.data.background);
	this.core.gl.clear(this.core.gl.COLOR_BUFFER_BIT|this.core.gl.DEPTH_BUFFER_BIT);

	this.core.gl.viewport(0, 0, this.core.width, this.core.height);
	glmat.mat4.perspective(this.data.world.m.pMatrix, 45.0, this.core.width/this.core.height, 0.1, 100.0);

	this.handleInputs();
	//handleInputs();

	this.lights[0].position = this.player.pos.slice(0);
	this.lights[0].position[2] += 2;
	this.sprites.sprites[1].moveToward(this.terrain, this.player.pos);
	this.camera.moveCenter(this.player.pos, [0.0, 0.0, 0.5]);
	this.camera.updateMatrix(this.terrain.cubes);

	this.checkStairs();

	this.renderWorld();
	this.renderSprites();
};

SceneLoading.prototype.renderWorld = function(){
	this.core.gl.enable(this.core.gl.CULL_FACE);
	this.core.gl.cullFace(this.core.gl.BACK);
	this.core.gl.useProgram(this.data.world.program);
	this.data.world.m.vMatrix = this.camera.matrix;

	this.core.gl.uniformMatrix4fv(this.data.world.u.MMatrix, false, this.data.world.m.mMatrix);
	this.core.gl.uniformMatrix4fv(this.data.world.u.VMatrix, false, this.data.world.m.vMatrix);
	this.core.gl.uniformMatrix4fv(this.data.world.u.PMatrix, false, this.data.world.m.pMatrix);

	this.core.gl.uniform3fv(this.data.world.u.AmbientColor, this.level.ambient);

	this.updateLights(this.data.world);
	// Bind buffers
	this.attribSetup(this.data.world.a.Position, this.terrain.vertexObject, 3);
	this.attribSetup(this.data.world.a.Texture, this.terrain.texCoordObject, 2);
	this.attribSetup(this.data.world.a.Normal, this.terrain.normalObject, 3);

	this.core.gl.activeTexture(this.core.gl.TEXTURE0);
	this.core.gl.bindTexture(this.core.gl.TEXTURE_2D, this.terrain.textureAtlas.texture);
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

SceneLoading.prototype.attribSetup = function(attrib, object, size, type) {
	if (!type)
		type = this.core.gl.FLOAT;
	this.core.gl.enableVertexAttribArray(attrib);
	this.core.gl.bindBuffer(this.core.gl.ARRAY_BUFFER, object);
	this.core.gl.vertexAttribPointer(attrib, size, type, false, 0, 0);
};

SceneLoading.prototype.renderSprites = function() {
	this.core.gl.disable(this.core.gl.CULL_FACE);

	this.core.gl.useProgram(this.data.sprites.program);
	this.data.world.m.vMatrix = this.camera.matrix;

	this.sprites.sprites[0].theta = this.camera.theta[2];
	this.sprites.update();

	this.core.gl.uniformMatrix4fv(this.data.sprites.u.MMatrix, false, this.data.world.m.mMatrix);
	this.core.gl.uniformMatrix4fv(this.data.sprites.u.VMatrix, false, this.data.world.m.vMatrix);
	this.core.gl.uniformMatrix4fv(this.data.sprites.u.PMatrix, false, this.data.world.m.pMatrix);

	this.core.gl.uniform1f(this.data.sprites.u.Counter, this.frame_count);
	this.core.gl.uniform3fv(this.data.sprites.u.AmbientColor, this.level.ambient);
	this.core.gl.uniform3fv(this.data.sprites.u.CamPos, this.camera.pos);

	this.updateLights(this.data.sprites);

	// Bind buffers
	this.attribSetup(this.data.sprites.a.Position, this.sprites.vertexObject, 3);
	this.attribSetup(this.data.sprites.a.Texture, this.sprites.texCoordObject, 2);
	this.attribSetup(this.data.sprites.a.Offset, this.sprites.offsetObject, 3);
	this.attribSetup(this.data.sprites.a.Moving, this.sprites.movingObject, 1);
	this.attribSetup(this.data.sprites.a.Flipped, this.sprites.flippedObject, 1);

	this.core.gl.activeTexture(this.core.gl.TEXTURE0);
	this.core.gl.bindTexture(this.core.gl.TEXTURE_2D, this.sprites.textureAtlas.texture);
	this.core.gl.uniform1i(this.data.sprites.u.Sampler, 0);

	this.core.gl.bindBuffer(this.core.gl.ELEMENT_ARRAY_BUFFER, this.sprites.indexObject);
	this.core.gl.drawElements(this.core.gl.TRIANGLES, this.sprites.numVertices(), this.core.gl.UNSIGNED_SHORT, 0);
};

SceneLoading.prototype.checkStairs = function() {
	var cubePos = [0,0,0];
	for (var i=0; i<3; i++)
		cubePos[i] = Math.floor(this.sprites.sprites[1].pos[i]);
	if (cubePos[0] == this.dungeonObj.downstairs[0] && 
		cubePos[1] == this.dungeonObj.downstairs[1]) {
		this.goToLevel(++this.levelNum);
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
	/*
			if (input.rightClick) {
				var angleChange = [-input.mouseMove[1]*this.data.rotateSpeed, 0, input.mouseMove[0]*this.data.rotateSpeed];
				this.camera.changeAngle(angleChange);
			}

			input.mouseMove = [0,0];
			if (input.scroll) {
				this.camera.changeDistance(input.scroll);
				input.scroll = 0;
			}
	*/
};
module.exports = SceneLoading;

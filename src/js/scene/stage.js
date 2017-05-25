'use strict';

// utils
Number.prototype.clamp = function(min, max) {
	return (this < min ? min : (this > max ? max : this));
};
function centerXY(pos) {
	return [pos[0]+0.5, pos[1]+0.5, pos[2]];
}




var base_scene = require('../hakurei').scene.base;
var util = require('../hakurei').util;
var AssetsConfig = require('../assets_config');
var createWebGLContext = require('../gl');
var TextureAtlas = require('../texture');
var Terrain = require('../terrain');
var Camera = require('../camera');
var Level = require('../level');
var PointLight = require('../point_light');
var Sprites = require('../sprites');
var DungeonConvert = require('../dungeon_convert');

var SceneLoading = function(core) {
	base_scene.apply(this, arguments);
};
util.inherit(SceneLoading, base_scene);

SceneLoading.prototype.init = function() {
	base_scene.prototype.init.apply(this, arguments);

	this.canvas = document.getElementById('subCanvas');
	this.gl = createWebGLContext(this.canvas);

	var texture = {};
	texture.land    = new TextureAtlas(this.gl, this.core.image_loader.getImage("ldfaithful"), 8);
	texture.sprites = new TextureAtlas(this.gl, this.core.image_loader.getImage("oryx"), 8);

	this.counter = 0; // TODO: frame_count に置き換える

	// 地形
	this.terrain = new Terrain(this.gl, texture.land);
	// カメラ
	this.camera = new Camera();

	// レベル
	this.levelNum = 0; // 1~8
	this.level = Level.getLevel(this.levelNum); // TODO: gotolevel 内でやっているので不要では

	// ライト一覧
	this.lights = [];
	// (恐らく)スタート地点のライト
	this.lights[0] = new PointLight([1.0, 0.5, 0.0], [0,0,1], [0.3, 0.1, 0.05]);


	this.sprites = new Sprites(this.gl, texture.sprites);
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
	/*
	this.gl.clearColor.apply(this,data.background);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT|this.gl.DEPTH_BUFFER_BIT);

	this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
	this.glmat.mat4.perspective(data.world.m.pMatrix, 45.0, this.canvas.width/this.canvas.height, 0.1, 100.0);

	//handleInputs();

	this.lights[0].position = this.player.pos.slice(0);
	this.lights[0].position[2] += 2;
	this.sprites.sprites[1].moveToward(this.terrain, this.player.pos);
	this.camera.moveCenter(this.player.pos, [0.0, 0.0, 0.5]);
	this.camera.updateMatrix(this.terrain.cubes);

	checkStairs();

	renderWorld();
	renderSprites();
	*/

};

/*


		function renderWorld() {
			gl.enable(gl.CULL_FACE);
			gl.cullFace(gl.BACK);
			gl.useProgram(data.world.program);
			data.world.m.vMatrix = this.camera.matrix;

			gl.uniformMatrix4fv(data.world.u.MMatrix, false, data.world.m.mMatrix);
			gl.uniformMatrix4fv(data.world.u.VMatrix, false, data.world.m.vMatrix);
			gl.uniformMatrix4fv(data.world.u.PMatrix, false, data.world.m.pMatrix);

			gl.uniform3fv(data.world.u.AmbientColor, this.level.ambient);

			updateLights(data.world);
			// Bind buffers
			attribSetup(data.world.a.Position, this.terrain.vertexObject, 3);
			attribSetup(data.world.a.Texture, this.terrain.texCoordObject, 2);
			attribSetup(data.world.a.Normal, this.terrain.normalObject, 3);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.terrain.textureAtlas.texture);
			gl.uniform1i(data.world.u.Sampler, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.terrain.indexObject);
			gl.drawElements(gl.TRIANGLES, this.terrain.numVertices(), gl.UNSIGNED_SHORT, 0);
		}

		function updateLights(program) {
			for (var i=0; i<this.lights.length; i++) {
				this.lights[i].update();
				gl.uniform1f(program.u.Light[i].enabled, this.lights[i].enabled);
				gl.uniform3fv(program.u.Light[i].attenuation, this.lights[i].attenuation);
				gl.uniform3fv(program.u.Light[i].color, this.lights[i].color);
				gl.uniform3fv(program.u.Light[i].position, this.lights[i].position);
			}
		}

		function attribSetup(attrib, object, size, type) {
			if (!type)
				type = gl.FLOAT;
			gl.enableVertexAttribArray(attrib);
			gl.bindBuffer(gl.ARRAY_BUFFER, object);
			gl.vertexAttribPointer(attrib, size, type, false, 0, 0);
		}

		function renderSprites() {
			gl.disable(gl.CULL_FACE);
			this.counter++;

			gl.useProgram(data.sprites.program);
			data.world.m.vMatrix = this.camera.matrix;

			this.sprites.sprites[0].theta = this.camera.theta[2];
			this.sprites.update();

			gl.uniformMatrix4fv(data.sprites.u.MMatrix, false, data.world.m.mMatrix);
			gl.uniformMatrix4fv(data.sprites.u.VMatrix, false, data.world.m.vMatrix);
			gl.uniformMatrix4fv(data.sprites.u.PMatrix, false, data.world.m.pMatrix);

			gl.uniform1f(data.sprites.u.Counter, this.counter);
			gl.uniform3fv(data.sprites.u.AmbientColor, this.level.ambient);
			gl.uniform3fv(data.sprites.u.CamPos, this.camera.pos);

			updateLights(data.sprites);

			// Bind buffers
			attribSetup(data.sprites.a.Position, this.sprites.vertexObject, 3);
			attribSetup(data.sprites.a.Texture, this.sprites.texCoordObject, 2);
			attribSetup(data.sprites.a.Offset, this.sprites.offsetObject, 3);
			attribSetup(data.sprites.a.Moving, this.sprites.movingObject, 1);
			attribSetup(data.sprites.a.Flipped, this.sprites.flippedObject, 1);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.sprites.textureAtlas.texture);
			gl.uniform1i(data.sprites.u.Sampler, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sprites.indexObject);
			gl.drawElements(gl.TRIANGLES, this.sprites.numVertices(), gl.UNSIGNED_SHORT, 0);
		}

		function checkStairs() {
			var cubePos = [0,0,0];
			for (var i=0; i<3; i++)
				cubePos[i] = Math.floor(this.sprites.sprites[1].pos[i]);
			if (cubePos[0] == this.dungeonObj.downstairs[0] && 
				cubePos[1] == this.dungeonObj.downstairs[1]) {
				goToLevel(++this.levelNum);
			}
		}
	}
*/
/*
		function handleInputs() {
			var inputMask = 0;
			if (input.pressedKeys[87]) inputMask += 1; // W
			if (input.pressedKeys[65]) inputMask += 2; // A
			if (input.pressedKeys[83]) inputMask += 4; // S
			if (input.pressedKeys[68]) inputMask += 8; // D

			switch(inputMask) {
			case  1: this.player.turnAndMove(this.terrain, 0); break;
			case  2: this.player.flipped = 1; this.player.turnAndMove(this.terrain, Math.PI/2); break;
			case  3: this.player.flipped = 1; this.player.turnAndMove(this.terrain, Math.PI/4); break;
			case  4: this.player.turnAndMove(this.terrain, Math.PI); break;
			case  6: this.player.flipped = 1; this.player.turnAndMove(this.terrain, 3/4*Math.PI); break;
			case  8: this.player.flipped = 0; this.player.turnAndMove(this.terrain,-Math.PI/2); break;
			case  9: this.player.flipped = 0; this.player.turnAndMove(this.terrain,-Math.PI/4); break;
			case 12: this.player.flipped = 0; this.player.turnAndMove(this.terrain, 5/4*Math.PI); break;
			}

			if (input.rightClick) {
				var angleChange = [-input.mouseMove[1]*data.rotateSpeed, 0, input.mouseMove[0]*data.rotateSpeed];
				this.camera.changeAngle(angleChange);
			}

			input.mouseMove = [0,0];
			if (input.scroll) {
				this.camera.changeDistance(input.scroll);
				input.scroll = 0;
			}
		}
*/
module.exports = SceneLoading;

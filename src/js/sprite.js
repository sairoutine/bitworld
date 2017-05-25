'use strict';
var Sprite = function(pos) {
	this.pos = pos ? pos : [0,0,0];
	this.theta = 0;
	this.vel = [0,0,0];
	this.maxSpeed = 0.1;
	this.moving = 0;
	this.flipped = 0.0;
};
Sprite.prototype.moveTo = function(pos) {
	this.pos = pos;
	this.moving = 0;
};
Sprite.prototype.moveToward = function(env,pos) {
	var dx = pos[0] - this.pos[0];
	var dy = pos[1] - this.pos[1];
	if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1)
		return;
	this.theta = Math.atan2(dy,dx);
	this.limitTheta();
	this.flipped = (this.theta < 0.5*Math.PI || this.theta > 1.5*Math.PI) ? 0 : 1;
	this.moveForward(env);
};
Sprite.prototype.limitTheta = function() {
	if (this.theta < 0)
		this.theta += 2*Math.PI;
	else if (this.theta > 2*Math.PI)
		this.theta -= 2*Math.PI;
};
Sprite.prototype.turnAndMove = function(env, amount) {
	this.theta += amount;
	this.moveForward(env);
	this.theta -= amount;
	this.limitTheta();
};
Sprite.prototype.moveForward = function(env) {
	this.vel[0] = this.maxSpeed*Math.cos(this.theta);
	this.vel[1] = this.maxSpeed*Math.sin(this.theta);
	this.checkCollision(env);
	for (var i=0; i<3; i++)
		this.pos[i] += this.vel[i];
	this.moving = 1;
};
Sprite.prototype.checkCollision = function(env) {
	for (var i=0; i<3; i++) {
		if (this.vel[i] == 0)
			continue;

		var padding = (this.vel[i] > 0) ? 0.5 : -0.5;
		
		var testPos = this.pos.slice(0);
		testPos[i] += this.vel[i] + padding;
		if (env.collision(testPos))
			this.vel[i] = 0;
	}
};
module.exports = Sprite;

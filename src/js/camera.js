'use strict';
var glmatrix = require("gl-matrix");
var Util = require('./hakurei').util;

var Camera = function() {
	this.matrix = glmatrix.mat4.create();
	glmatrix.mat4.identity(this.matrix);

	this.theta = [1.7*Math.PI, 0.0, 0.5*Math.PI]; // Rotation about X and Z axes
	this.center = [0, 0, 0];
	this.up = [0, 0, 1];
	this.pos = [0, 0, 0];

	this.thetaLimits = [1.5*Math.PI, 1.8*Math.PI];
	this.distanceLimits = [2.0, 15.0];
	this.zoomWeight = 0.1;

	this.currentDistance = (this.distanceLimits[0]+this.distanceLimits[1])/2;
	this.desiredDistance = this.currentDistance;

	this.updateMatrix();
};
/** If there is an object between the camera and the center, move
	the camera in front of the blocking object */
Camera.prototype.checkCollision = function(env) {
	return false;
};

Camera.prototype.moveCenter = function(pos, offset) {
	this.center = pos.slice(0);
	if (offset) {
		for (var i=0; i<3; i++)
			this.center[i] += offset[i];
	}
};

Camera.prototype.changeAngle = function(dTheta) {
	this.theta[0] -= dTheta[0];
	this.theta[1] -= dTheta[1];
	this.theta[2] -= dTheta[2];
	this.theta[0] = Util.clamp(this.theta[0], this.thetaLimits[0],this.thetaLimits[1]);
};

Camera.prototype.setAngle = function(theta) {
	this.theta = theta;
	this.theta[0] = Util.clamp(this.theta[0], this.thetaLimits[0],this.thetaLimits[1]);
};

Camera.prototype.changeDistance = function(amount) {
	this.desiredDistance += amount;
	this.desiredDistance = Util.clamp(this.desiredDistance, this.distanceLimits[0],this.distanceLimits[1]);
};

Camera.prototype.setDistance = function(dist) {
	this.desiredDistance = dist;
	this.desiredDistance = Util.clamp(this.desiredDistance, this.distanceLimits[0],this.distanceLimits[1]);
};

Camera.prototype.sphericalToCartesian = function(origin,r,angles) {
	return [ 
		origin[0] + r * Math.sin(angles[0]) * Math.cos(angles[2]),
		origin[1] + r * Math.sin(angles[0]) * Math.sin(angles[2]),
		origin[2] + r * Math.cos(angles[0])
	];
};

Camera.prototype.updateMatrix = function(env) {
	for (var i=0; i<3; i++) {
		if (this.theta[i] < 0)
			this.theta[i] += 2*Math.PI;
		else if (this.theta[i] > 2*Math.PI)
			this.theta[i] -= 2*Math.PI;
	}
	if (env) {
		this.currentDistance *= 1-this.zoomWeight; 
		this.currentDistance += this.zoomWeight*this.desiredDistance;
	}

	this.pos = this.sphericalToCartesian(this.center, this.currentDistance, this.theta);
	glmatrix.mat4.lookAt(this.matrix, this.pos, this.center, this.up);
};

module.exports = Camera;

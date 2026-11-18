const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const corePackageRoot = path.resolve(workspaceRoot, 'packages/scanqr-core');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [corePackageRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  '@scanqr/core': corePackageRoot,
};

module.exports = config;

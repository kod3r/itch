
require('quiet-grunt')

var channel = process.env.CI_CHANNEL || 'stable'
var appName = (channel === 'stable' ? 'itch' : 'kitch')

var fs = require('fs')
var path = require('path')
var packagePath = path.join(__dirname, 'package.json')
var version = process.env.CI_VERSION || JSON.parse(fs.readFileSync(packagePath, { encoding: 'utf8' })).version

var iconsPath = path.join('release', 'images', appName + '-icons')
var icoPath = path.join(iconsPath, 'itch.ico')
var icnsPath = path.join(iconsPath, 'itch.icns')
var installerGifPath = 'release/images/installer.gif'

var electronVersion = '1.2.5'
var outDir = path.join('build', 'v' + version)
var companyName = 'Itch Corp'

var gruntElectronCommon = {
  dir: 'stage',
  name: appName,
  version: electronVersion,
  'app-version': version,
  prune: true,
  asar: true,
  overwrite: true,
  out: outDir
}

var windowsElectronOptions = Object.assign({}, gruntElectronCommon, {
  platform: 'win32',
  icon: icoPath,
  'version-string': {
    CompanyName: companyName,
    LegalCopyright: 'MIT license, (c) Itch Corp',
    FileDescription: appName,
    OriginalFileName: appName + '.exe',
    FileVersion: version,
    AppVersion: version,
    ProductName: appName,
    InternalName: appName + '.exe'
  }
})

var electronInstallerCommon = {
  authors: companyName,
  exe: appName + '.exe',
  description: 'The best way to play itch.io games',
  version: version,
  title: appName,
  // sic. it's really itch.ico
  iconUrl: 'http://raw.githubusercontent.com/itchio/itch/master/release/images/' + appName + '-icons/itch.ico',
  loadingGif: installerGifPath,
  setupIcon: icoPath,
  remoteReleases: 'https://github.com/itchio/' + appName,
  signWithParams: '/v /s MY /n "Open Source Developer, Amos Wenger" /fd sha256 /tr http://timestamp.comodoca.com/?td=sha256 /td sha256',
  noMsi: true
}

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt)

  grunt.initConfig({
    // Create a .exe, .app, folder for windows, mac, linux
    electron: {
      'windows-ia32': {
        options: Object.assign({
          arch: 'ia32'
        }, windowsElectronOptions)
      },
      'darwin-x64': {
        options: Object.assign({}, gruntElectronCommon, {
          platform: 'darwin',
          arch: 'x64',
          icon: icnsPath,
          'app-bundle-id': 'io.' + appName + '.mac',
          'app-category-type': 'public.app-category.games',
          protocols: [{
            name: 'itch.io',
            schemes: [appName + 'io']
          }]
        })
      },
      'linux-ia32': {
        options: Object.assign({}, gruntElectronCommon, {
          platform: 'linux',
          arch: 'ia32'
        })
      },
      'linux-x64': {
        options: Object.assign({}, gruntElectronCommon, {
          platform: 'linux',
          arch: 'x64'
        })
      }
    },
    'create-windows-installer': {
      'ia32': Object.assign({}, electronInstallerCommon, {
        appDirectory: path.join(outDir, appName + '-win32-ia32'),
        outputDirectory: process.env.CI_WINDOWS_INSTALLER_PATH || path.join('build', 'squirrel-ia32')
      })
    },
    'babel': {
      options: {
        sourceMap: true
      },
      dist: {
        files: [
          { expand: true, cwd: 'appsrc', src: ['**/*.js'], dest: 'app' },
          { expand: true, cwd: 'testsrc', src: ['**/*.js'], dest: 'test' }
        ]
      }
    },
    'sass': {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'app/style/bundle.css': ['appsrc/style/bundle.scss', 'appsrc/style/**/*.scss']
        }
      }
    },
    'copy': {
      options: {
        mode: true
      },
      dist: {
        files: [
          { expand: true, cwd: 'appsrc', src: ['**/*.html', 'static/**'], dest: 'app' },
          { expand: true, cwd: 'testsrc', src: ['runner'], dest: 'test' }
        ]
      }
    }
  })

  grunt.registerTask('default', ['newer:babel', 'newer:sass', 'newer:copy'])
}

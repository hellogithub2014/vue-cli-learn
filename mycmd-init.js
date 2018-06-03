#!/usr/bin/env node
const inquirer = require('inquirer');
const latestVersion = require('latest-version');
const program = require('commander');
const path = require('path');
const fs = require('fs');
const glob = require('glob'); // npm i glob -D

const download = require('./lib/download');
const generator = require('./lib/generator');
const moveFiles = require('./lib/moveFiles');

program.usage('<project-name>').parse(process.argv);

// 根据输入，获取项目名称
let projectName = program.args[0];

if (!projectName) {
  // project-name 必填
  // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
  program.help();
  return;
}

const list = glob.sync('*'); // 遍历当前目录
let rootName = path.basename(process.cwd());

let next = undefined;

if (list.length) {
  // 如果当前目录不为空
  if (
    list.filter(name => {
      const fileName = path.resolve(process.cwd(), path.join('.', name));
      const isDir = fs.statSync(fileName).isDirectory();
      return name.indexOf(projectName) !== -1 && isDir;
    }).length
  ) {
    console.log(`项目${projectName}已经存在`);
    return;
  }

  next = Promise.resolve(projectName);
} else if (rootName === projectName) {
  next = inquirer
    .prompt([
      {
        name: 'buildInCurrent',
        message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
        type: 'confirm',
        default: true,
      },
    ])
    .then(answer => Promise.resolve(answer.buildInCurrent ? '.' : projectName));
} else {
  next = Promise.resolve(projectName);
}

next && go();

function go() {
  next
    .then(projectRoot => {
      if (projectRoot !== '.') {
        fs.mkdirSync(projectRoot);
      }
      // 预留，处理子命令
      // console.log(path.resolve(process.cwd(), path.join('.', rootName)));
      return download(projectRoot).then(target => ({
        name: projectRoot,
        root: projectRoot,
        downloadTemp: target,
      }));
    })
    .then(context => {
      return inquirer['prompt']([
        {
          name: 'projectName',
          message: '项目的名称',
          default: context.name,
        },
        {
          name: 'projectVersion',
          message: '项目的版本号',
          default: '1.0.0',
        },
        {
          name: 'projectDescription',
          message: '项目的简介',
          default: `A project named ${context.name}`,
        },
      ]).then(answers => {
        return latestVersion('download-git-repo')
          .then(version => {
            answers.supportUiVersion = version;
            return {
              ...context,
              metadata: {
                ...answers,
              },
            };
          })
          .catch(err => {
            return Promise.reject(err);
          });
      });
    })
    .then(context => {
      return moveFiles('template/template', context.name).then(_ => context);
    })
    .then(context => {
      console.log(context);
      return generator(context);
    })
    .catch(err => console.log(err));
}

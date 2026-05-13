#!/usr/bin/env node
import { Command } from 'commander';
import { registerAnalyzeCommand } from './app/commands/analyze';

const program = new Command();

program
  .name('angular-doctor')
  .description('Analyzes Angular projects for performance, architecture and bad practices')
  .version('0.1.0');

registerAnalyzeCommand(program);

program.parse(process.argv);
import { draw } from './ObjectManager.js';

const canvas=document.getElementById('board');
const ctx=canvas.getContext('2d');

export function render(){ draw(ctx); }

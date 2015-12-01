import * as g from './generator';


let lastId = 0;
export default (): g.IGenerationProcess => {
    let myId = '' + (lastId++);
    return {
		run: () => new Promise((f, r) => {
			console.log('Cursors generator runs...');
			f();
		})
    };
}
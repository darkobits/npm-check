import emoji from 'node-emoji';


let emojiEnabled = true;


function output(name: string) {
  if (emojiEnabled) {
    return emoji.emojify(name);
  }

  return '';
}


output.enabled = (val: boolean) => {
  emojiEnabled = val;
};


export default output;

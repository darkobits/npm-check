import npmCheck from 'lib/in/index';
import createState from 'lib/state/state';


export default async function init(userOptions: any) {
  const currentState = await createState(userOptions);
  return npmCheck(currentState);
}

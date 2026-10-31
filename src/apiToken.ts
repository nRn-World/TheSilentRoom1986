/** The connected session token lives here, outside the component module, so React fast refresh keeps working. */
let accessToken = '';
export const setAccessToken = (token: string) => { accessToken = token; };
export const getAccessToken = () => accessToken;

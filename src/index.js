/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request, env, ctx) {
        const response = await env.AI.run(
            "@hf/nousresearch/hermes-2-pro-mistral-7b", {
                messages: [{ role: "user", content: "What's the weather in Austin, Texas?" }],
                tools: [
                    {
                        name: "getWeather",
                        description: "Return the weather for a latitude and longitude",
                        parameters: {
                            type: "object",
                            properties: {
                                latitude: {
                                    type: "string",
                                    description: "The latitude for the given location",
                                },
                                longitude: {
                                    type: "string",
                                    description: "The longitude for the given location",
                                },
                            },
                            required: ["latitude", "longitude"],
                        },
                    },
                ],
            }
        );

        const selected_tool = response.tool_calls[0];
        let res;

        if (selected_tool.name == 'getWeather') {
            try {
                const latitude = selected_tool.arguments.latitude;
                const longitude = selected_tool.arguments.longitude;

                const url = `https://api.weatherapi.com/v1/current.json?key=${env.WEATHERAPI_TOKEN}&q=${latitude},${longitude}`;
                res = await fetch(url).then((res) => res.json());
            }
            catch (error) {
                return error;
            };
        };

        const finalResponse = await env.AI.run("@hf/nousresearch/hermes-2-pro-mistral-7b", {
                messages: [
                    { role: "user", content: "What's the weather in Austin, Texas?" },
                    {
                        role: "assistant",
                        content: "",
                        tool_call: selected_tool.name,
                    },
                    {
                        role: "tool",
                        name: selected_tool.name,
                        content: JSON.stringify(res)
                    }
                ],
                tools: [
                    {
                        name: "getWeather",
                        description: "Return the weather for a latitude and longitude",
                        parameters: {
                            type: "object",
                            properties: {
                                latitude: {
                                    type: "string",
                                    description: "The latitude for the given location",
                                },
                                longitude: {
                                    type: "string",
                                    description: "The longitude for the given location",
                                },
                            },
                            required: ["latitude", "longitude"],
                        },
                    },
                ],                
            }
        );

    return new Response(JSON.stringify(finalResponse));
    
    }
}
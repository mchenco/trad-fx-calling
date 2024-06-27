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
                messages: [{ role: "user", content: "Who is Cloudflare on github?" }],
                tools: [
                    {
                        name: "getGithubUser",
                        description: "Provides publicly available information about someone with a GitHub account.",
                        parameters: {
                            type: "object",
                            properties: {
                                username: {
                                    type: "string",
                                    description: "The handle for the GitHub user account.",
                                },
                            },
                            required: ["username"],
                        },
                    },
                ],
            }
        );

        const selected_tool = response.tool_calls[0];
        let res;

        if (selected_tool.name == 'getGithubUser') {
            try {
                const username = selected_tool.arguments.username;
                const url = `https://api.github.com/users/${username}`;
                res = await fetch(url, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36"
                    }
                }).then((res) => res.json());
            }
            catch (error) {
                return error;
            };
        };

        const finalResponse = await env.AI.run("@hf/nousresearch/hermes-2-pro-mistral-7b", {
                messages: [
                    { role: "user", content: "Who is Cloudflare on github?" },
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
                        name: "getGithubUser",
                        description: "Provides publicly available information about someone with a GitHub account.",
                        parameters: {
                            type: "object",
                            properties: {
                                username: {
                                    type: "string",
                                    description: "The handle for the GitHub user account.",
                                },
                            },
                            required: ["username"],
                        },
                    },
                ],                
            }
        );

    return new Response(JSON.stringify(finalResponse));
    }
}
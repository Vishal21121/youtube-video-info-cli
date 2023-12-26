import * as p from '@clack/prompts';
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';
import * as emoji from 'node-emoji'
import dotenv from 'dotenv';
dotenv.config();


async function getTranscript(url, query) {
    try {
        let data = await YoutubeTranscript.fetchTranscript(url);
        let content = "";
        data.forEach((el) => {
            content += el.text;
        });
        return await callGPT(content, query)
    } catch (error) {
        console.log("\n", error.message);
    }
}

async function callGPT(content, query) {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const chatCompletion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: `${content}\n ${query == "summary" ? " ? summarise the above content" : query}` }],
        model: 'gpt-3.5-turbo',
    });
    return chatCompletion.choices[0].message.content
}

const init = async () => {
    const group = await p.group({
        url: () => p.text({ message: "Enter the url of the video" }),
        action: () => p.select({
            message: "Choose any one option",
            options: [
                { value: "summary", label: "Do you want summary of the video?" },
                { value: "ask question", label: "Do you want to ask question related to video?" }
            ]
        })
    })
    const spinner = p.spinner()
    if (group.action !== "summary") {
        try {
            const value = await p.text({
                message: 'Enter your query related to video',
                initialValue: '',
                validate(value) {
                    if (value.length === 0) return `Value is required!`;
                },
            });
            spinner.start(`Fetching the results ${emoji.get("rocket")}`)
            getTranscript(group.url, value).then((response) => {
                console.log("\n", response);
                spinner.stop("")
            }).catch(error => {
                console.error("Error getting transcript:", error);
                spinner.stop("");
            });
            return
        } catch (error) {
            console.error("Error getting text:", error);
            spinner.stop("");
            return
        }
    } else {
        spinner.start(`Fetching the results ${emoji.get("rocket")}`)
        try {
            getTranscript(group.url, "summary").then((response) => {
                console.log("\n", response)
                spinner.stop("")
                return
            }).catch(error => {
                console.error("Error getting transcript:", error);
                spinner.stop("");
                return
            })
        } catch (error) {
            console.error("Error getting transcript:", error);
            spinner.stop("");
            return
        }
    }
}

init()


async function handleHovercodeError(response: Response) {
        const errorText = await response.text();
        console.error("Failed to fetch QR codes:", errorText);
        throw new Error(`Hovercode API error: ${response.status} ${response.statusText}`);
}

export { handleHovercodeError };
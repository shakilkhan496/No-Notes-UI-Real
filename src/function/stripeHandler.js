// Async function to create a customer or return existing if found
async function createCustomer(stripe,email) {
    try {
        // Check if customer with given email exists
        const existingCustomers = await stripe.customers.list({ email: email });

        // If customer exists, return it
        if (existingCustomers.data.length > 0) {
            return existingCustomers.data[0];
        } else {
            // If customer doesn't exist, create a new one
            const newCustomer = await stripe.customers.create({
                email: email,
            });
            return newCustomer;
        }
    } catch (error) {
        throw error;
    }
}

export default createCustomer;
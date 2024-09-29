const {
    sendPostRequest,
    convertHTMLToPDF,
    getInvoiceTable,
    formatDate
} = require('./util');

function sendOfferEmail(args) {

    return new Promise((resolve, reject) => {

        function applyFormatting(content) {
            content = content.replace(/{{email}}/gi, args.email);
            content = content.replace(/{{name}}/gi, args.name);
            content = content.replace(/{{offerEndDate}}/gi, formatDate(args.offerEndDate));
            content = content.replace(/{{todaysDate}}/gi, formatDate(args.todaysDate));
            return content;
        }

        let user = args.senderEmail;
        let pass = args.senderPassword;
        let from = args.senderName;
        let host = args.senderHostServer;
        let to = args.email;
        let subject = applyFormatting(args.subject);
        let html = applyFormatting(args.template);

        let data = {
            user,
            pass,
            from: from + "<" + user + ">",
            to,
            subject,
            html,
            host
        };

        if (args.isSendPDF) {
            data.attachments = JSON.stringify([{
                filename: "MarteDesign_Soluzioni_.pdf",
                path: args.PDFURL
            }]);
        }

        sendPostRequest(args.isSendPDF ? process.env.EMAIL_DISPATCHER_URL_V3 : process.env.EMAIL_DISPATCHER_URL_V2, data)
            .then(json => {
                if (json.status == 'success') {
                    resolve();
                } else {
                    console.log(json.message);
                    reject(json.message);
                }
            }).catch(err => {
                console.error("sendOfferEmail > sendPostRequest : " + err);
                reject(err);
            });
    });
}

function sendWelcomeEmail(args) {
    return new Promise((resolve, reject) => {

        function applyFormatting(content) {
            content = content.replace(/{{email}}/gi, args.email);
            content = content.replace(/{{name}}/gi, args.name);
            content = content.replace(/{{address}}/gi, args.address);
            content = content.replace(/{{startDate}}/gi, args.startDate);
            content = content.replace(/{{endDate}}/gi, args.endDate);
            content = content.replace(/{{currencySign}}/gi, args.currencySign);
            content = content.replace(/{{price}}/gi, args.price);
            content = content.replace(/{{paymentDescription}}/gi, args.paymentDescription);
            content = content.replace(/{{todaysDate}}/gi, formatDate(args.todaysDate));
            return content;
        }

        let user = args.senderEmail;
        let pass = args.senderPassword;
        let from = args.senderName;
        let host = args.senderHostServer;
        let to = args.email;
        let subject = applyFormatting(args.subject);
        let html = applyFormatting(args.template);

        let data = {
            user,
            pass,
            from: from + "<" + user + ">",
            to,
            subject,
            html,
            host
        };

        sendPostRequest(process.env.EMAIL_DISPATCHER_URL_V2, data)
            .then(json => {
                if (json.status == 'success') {
                    resolve();
                } else {
                    console.log(json.message);
                    reject(json.message);
                }
            }).catch(err => {
                console.error("sendWelcomeEmail > sendPostRequest : " + err);
                reject(err);
            });
    });
}

function sendInvoiceEmail(args) {
    return new Promise(async(resolve, reject) => {

        function applyFormatting(content) {
            content = content.replace(/{{email}}/gi, args.email);
            content = content.replace(/{{invoiceTable}}/gi, getInvoiceTable(args.price, args.paymentDescription));
            content = content.replace(/{{name}}/gi, args.name);
            content = content.replace(/{{address}}/gi, args.address);
            content = content.replace(/{{startDate}}/gi, args.startDate);
            content = content.replace(/{{endDate}}/gi, args.endDate);
            content = content.replace(/{{invoiceNumber}}/gi, args.invoiceNumber);
            content = content.replace(/{{currencySign}}/gi, args.currencySign);
            content = content.replace(/{{todaysDate}}/gi, formatDate(args.todaysDate));
            return content;
        }

        let user = args.senderEmail;
        let pass = args.senderPassword;
        let from = args.senderName;
        let host = args.senderHostServer;
        let to = args.email;
        let subject = applyFormatting(args.subject);
        let html = applyFormatting(args.template);

        let data = {
            user,
            pass,
            from: from + "<" + user + ">",
            to,
            subject,
            html,
            host,
            attachments: JSON.stringify([])
        };

        if (args.isSendPDF) {

            try {

                let pdfData = await createPDFInvoice(args);

                data.attachments = JSON.stringify([{
                    filename: "Invoice.pdf",
                    path: pdfData.data.url
                }]);

            } catch (err) {
                console.error("sendInvoiceEmail : " + err);
                return reject(err);
            }
        }

        sendPostRequest(args.isSendPDF ? process.env.EMAIL_DISPATCHER_URL_V3 : process.env.EMAIL_DISPATCHER_URL_V2, data)
            .then(json => {
                if (json.status == 'success') {
                    resolve();
                } else {
                    console.log(json.message);
                    reject(json.message);
                }
            }).catch(err => {
                console.error("sendInvoiceEmail > sendPostRequest : " + err);
                console.error(data);
                reject(err);
            });
    });
}

function createPDFInvoice(args) {
    return new Promise((resolve, reject) => {

        let html = args.htmlpdf.replace(/{{email}}/gi, args.email);
        html = html.replace(/{{invoiceTable}}/gi, getInvoiceTable(args.price, args.paymentDescription));
        html = html.replace(/{{name}}/gi, args.name);
        html = html.replace(/{{address}}/gi, args.address);
        html = html.replace(/{{startDate}}/gi, args.startDate);
        html = html.replace(/{{endDate}}/gi, args.endDate);
        html = html.replace(/{{invoiceNumber}}/gi, args.invoiceNumber);
        html = html.replace(/{{currencySign}}/gi, args.currencySign);
        html = html.replace(/{{todaysDate}}/gi, formatDate(args.todaysDate));

        convertHTMLToPDF(html).then(json => {
            if (json.success || json.status == "success") {
                resolve(json);
            } else {
                reject(json.message);
            }
        }).catch(err => {
            console.error("createPDFInvoice : " + err);
            reject(err);
        });
    });
}

module.exports = {
    sendOfferEmail,
    sendWelcomeEmail,
    sendInvoiceEmail
};
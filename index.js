async function main() {
    require('dotenv').config();

    const express = require("express");

    const { google } = require("googleapis");

    const auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: [
            "https://www.googleapis.com/auth/spreadsheets",
        ]
    });

    const client = await auth.getClient();

    google.options({ auth: client });

    const sheets = google.sheets({ version: "v4", auth: client });

    const { sendOfferEmail, sendWelcomeEmail, sendInvoiceEmail } = require("./emailRequests");

    const {
        colprosp,
        colcw,
        colconf,
        colstat
    } = require("./const");

    const { formatDate } = require("./util");

    const app = express();

    app.use(express.static('public'));

    const PORT = process.env.PORT;

    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

    app.get("/run", async(req, res) => {

        const markeformProspect_getRows = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Prospects"
        });

        const markeformClient_getRows = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Clients"
        });

        const markeformWorkspace_getRows = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Workspace"
        });

        const markeformConfig_getRows = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Config"
        });

        const markeformStats_getRows = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Stats"
        });

        const markeformLog_getRows = await sheets.spreadsheets.values.get({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Log"
        });

        let prospectRows = markeformProspect_getRows.data.values;

        let clientRows = markeformClient_getRows.data.values;

        let workspaceRows = markeformWorkspace_getRows.data.values;

        let configRows = markeformConfig_getRows.data.values;

        let statsRows = markeformStats_getRows.data.values;

        let logRows = markeformLog_getRows.data.values;

        statsRows[colstat.number_of_prospect_entries][1] = prospectRows.length - 1;

        statsRows[colstat.number_of_client_entries][1] = clientRows.length - 1;

        const workspaceDataToUpdate = [];

        const logDataToUpdate = logRows != undefined ? logRows : [];

        let todaysDate = new Date();

        statsRows[colstat.last_automation_run_date][1] = formatDate(todaysDate);

        clientRows.forEach(cRow => {

            if (cRow[colcw.timestamp] == "Timestamp") {

                workspaceDataToUpdate.push([...cRow, "Contract Status", "isWelcomeEmailSent", "isInvoiceSent"]);

            } else {
                let row = undefined;

                if (workspaceRows != undefined) {

                    row = workspaceRows.find(wRow => wRow[colcw.timestamp] == cRow[colcw.timestamp] && wRow[colcw.email] == cRow[colcw.email]);

                }

                if (cRow[colcw.contract_start_date] != undefined) {

                    if (row != undefined) {

                        workspaceDataToUpdate.push([
                            cRow[colcw.timestamp].trim(),
                            cRow[colcw.email].trim(),
                            cRow[colcw.name].trim(),
                            cRow[colcw.address].trim(),
                            cRow[colcw.currency_sign].trim(),
                            cRow[colcw.price].trim(),
                            cRow[colcw.payment_description].trim(),
                            cRow[colcw.contract_start_date].trim(),
                            cRow[colcw.contract_end_date].trim(),
                            row[colcw.contract_status].trim(),
                            row[colcw.is_welcome_email_sent].trim(),
                            row[colcw.is_invoice_email_sent].trim()
                        ]);

                    } else {

                        workspaceDataToUpdate.push([
                            cRow[colcw.timestamp].trim(),
                            cRow[colcw.email].trim(),
                            cRow[colcw.name].trim(),
                            cRow[colcw.address].trim(),
                            cRow[colcw.currency_sign].trim(),
                            cRow[colcw.price].trim(),
                            cRow[colcw.payment_description].trim(),
                            cRow[colcw.contract_start_date].trim(),
                            cRow[colcw.contract_end_date].trim(),
                            "Not started",
                            "No",
                            "No"
                        ]);

                    }

                }
            }
        });

        // send offer emails
        let numProspectRows = prospectRows.length;

        for (let i = 0; i < numProspectRows; i++) {

            if (prospectRows[i][colprosp.name] != "Name") {

                if (prospectRows[i][colprosp.offer_sent_on] == undefined) {

                    let oeds = (prospectRows[i][colprosp.offer_end_date]).split("/");
                    let offerEndDate = new Date(`${oeds[1]}/${oeds[0]}/${oeds[2]}`);

                    if (todaysDate < offerEndDate) {

                        try {

                            await sendOfferEmail({
                                todaysDate,
                                senderEmail: configRows[colconf.offer_email_sender_email][1],
                                senderPassword: configRows[colconf.offer_email_sender_password][1],
                                senderHostServer: configRows[colconf.offer_email_host_server][1],
                                senderName: configRows[colconf.offer_email_sender_name][1],
                                subject: configRows[colconf.offer_email_subject][1],
                                template: configRows[colconf.offer_email_template][1],
                                isSendPDF: configRows[colconf.offer_email_send_pdf][1].trim().toLowerCase() == "yes",
                                PDFURL: configRows[colconf.offer_email_pdf_url][1],
                                name: prospectRows[i][colprosp.name],
                                email: prospectRows[i][colprosp.email],
                                offerEndDate,
                            });

                            prospectRows[i][colprosp.offer_sent_on] = formatDate(todaysDate);

                            statsRows[colstat.number_of_offer_emails_sent][1] = Number(statsRows[colstat.number_of_offer_emails_sent][1]) + 1;

                            logDataToUpdate.push([formatDate(todaysDate), "Offer email sent", statsRows[colstat.number_of_offer_emails_sent][1], ...prospectRows[i]]);

                        } catch (err) {

                            console.log("Failed to send offer email to: " + prospectRows[i][colprosp.email]);

                            console.error(err);

                        }
                    }
                }
            }
        }

        // send welcome or invoice email
        let numWorkspaceData = workspaceDataToUpdate.length;

        for (let i = 0; i < numWorkspaceData; i++) {

            if (workspaceDataToUpdate[i][colcw.timestamp] != "Timestamp") {

                let csds = (workspaceDataToUpdate[i][colcw.contract_start_date]).split("/");
                let contractStartDate = new Date(`${csds[1]}/${csds[0]}/${csds[2]}`);

                let ceds = (workspaceDataToUpdate[i][colcw.contract_end_date]).split("/");
                let contractEndDate = new Date(`${ceds[1]}/${ceds[0]}/${ceds[2]}`);

                if (todaysDate < contractStartDate) {

                    workspaceDataToUpdate[i][colcw.contract_status] = "Not started";

                } else if (todaysDate <= contractEndDate) {

                    workspaceDataToUpdate[i][colcw.contract_status] = "Ongoing";

                    if (workspaceDataToUpdate[i][colcw.is_welcome_email_sent].toLowerCase() == "no") {

                        try {

                            await sendWelcomeEmail({
                                todaysDate,
                                senderEmail: configRows[colconf.welcome_email_sender_email][1],
                                senderPassword: configRows[colconf.welcome_email_sender_password][1],
                                senderHostServer: configRows[colconf.welcome_email_host_server][1],
                                senderName: configRows[colconf.welcome_email_sender_name][1],
                                subject: configRows[colconf.welcome_email_subject][1],
                                template: configRows[colconf.welcome_email_template][1],
                                email: workspaceDataToUpdate[i][colcw.email],
                                name: workspaceDataToUpdate[i][colcw.name],
                                address: workspaceDataToUpdate[i][colcw.address],
                                currencySign: workspaceDataToUpdate[i][colcw.currency_sign],
                                price: workspaceDataToUpdate[i][colcw.price],
                                paymentDescription: workspaceDataToUpdate[i][colcw.payment_description],
                                startDate: workspaceDataToUpdate[i][colcw.contract_start_date],
                                endDate: workspaceDataToUpdate[i][colcw.contract_end_date],
                            });

                            workspaceDataToUpdate[i][colcw.is_welcome_email_sent] = "Yes";

                            statsRows[colstat.number_of_welcome_emails_sent][1] = Number(statsRows[colstat.number_of_welcome_emails_sent][1]) + 1;

                            logDataToUpdate.push([formatDate(todaysDate), "Welcome email sent", statsRows[colstat.number_of_welcome_emails_sent][1], ...workspaceDataToUpdate[i]]);

                        } catch (err) {

                            console.log("Failed to send welcome email to: " + workspaceDataToUpdate[i][colcw.email]);

                            console.error(err);

                        }

                    } else if (workspaceDataToUpdate[i][colcw.is_welcome_email_sent].toLowerCase() == "yes" && workspaceDataToUpdate[i][colcw.is_invoice_email_sent].toLowerCase() == "no" && todaysDate.getDate() == configRows[colconf.invoice_send_day][1]) {

                        try {
                            await sendInvoiceEmail({
                                todaysDate,
                                senderEmail: configRows[colconf.invoice_email_sender_email][1],
                                senderPassword: configRows[colconf.invoice_email_sender_password][1],
                                senderHostServer: configRows[colconf.invoice_email_host_server][1],
                                senderName: configRows[colconf.invoice_email_sender_name][1],
                                subject: configRows[colconf.invoice_email_subject][1],
                                template: configRows[colconf.invoice_email_template][1],
                                htmlpdf: configRows[colconf.invoice_email_pdf_template][1],
                                isSendPDF: configRows[colconf.invoice_email_send_pdf][1].trim().toLowerCase() == "yes",
                                invoiceNumber: statsRows[colstat.current_invoice_number_index][1].padStart(6, "0"),
                                email: workspaceDataToUpdate[i][colcw.email],
                                name: workspaceDataToUpdate[i][colcw.name],
                                address: workspaceDataToUpdate[i][colcw.address],
                                currencySign: workspaceDataToUpdate[i][colcw.currency_sign],
                                price: workspaceDataToUpdate[i][colcw.price].split(","),
                                paymentDescription: workspaceDataToUpdate[i][colcw.payment_description].split(","),
                                startDate: workspaceDataToUpdate[i][colcw.contract_start_date],
                                endDate: workspaceDataToUpdate[i][colcw.contract_end_date],
                            });

                            workspaceDataToUpdate[i][colcw.is_invoice_email_sent] = "Yes";

                            statsRows[colstat.number_of_invoice_emails_sent][1] = Number(statsRows[colstat.number_of_invoice_emails_sent][1]) + 1;

                            statsRows[colstat.current_invoice_number_index][1] = Number(statsRows[colstat.current_invoice_number_index][1]) + 1;

                            logDataToUpdate.push([formatDate(todaysDate), "Invoice email sent", statsRows[colstat.number_of_invoice_emails_sent][1], statsRows[colstat.current_invoice_number_index][1], ...workspaceDataToUpdate[i]]);

                        } catch (err) {

                            console.log("Failed to send invoice email to: " + workspaceDataToUpdate[i][colcw.email]);

                            console.error(err);

                        }

                    } else if (workspaceDataToUpdate[i][colcw.is_welcome_email_sent] == "Yes" && workspaceDataToUpdate[i][colcw.is_invoice_email_sent] == "Yes" && todaysDate.getDate() != configRows[colconf.invoice_send_day][1]) {

                        workspaceDataToUpdate[i][colcw.is_invoice_email_sent] = "No";

                    }

                } else {

                    workspaceDataToUpdate[i][colcw.contract_status] = "Expired";

                }
            }
        }

        // update prospects
        await sheets.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Prospects",
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: prospectRows
            }
        });

        // update workspace
        await sheets.spreadsheets.values.clear({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Workspace"
        });

        await sheets.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Workspace",
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: workspaceDataToUpdate
            }
        });

        // update stats
        await sheets.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Stats",
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: statsRows
            }
        });

        // update logs
        await sheets.spreadsheets.values.clear({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Log"
        });

        await sheets.spreadsheets.values.update({
            auth,
            spreadsheetId: process.env.SPREADSHEETID,
            range: "Log",
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: logDataToUpdate
            }
        });

        res.send("Done!");
    });

    app.get("/", (req, res) => {
        res.send("Marte Client Submission Form Project");
    });
}

main().catch(e => {
    console.error(e);
    throw e;
});
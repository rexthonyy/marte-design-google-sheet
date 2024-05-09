module.exports = {
    // prospect
    colprosp: {
        "name": 0,
        "email": 1,
        "offer_end_date": 2,
        "offer_sent_on": 3
    },
    // clients & workspace
    colcw: {
        "timestamp": 0,
        "email": 1,
        "name": 2,
        "address": 3,
        "currency_sign": 4,
        "price": 5,
        "payment_description": 6,
        "contract_start_date": 7,
        "contract_end_date": 8,
        "contract_status": 9,
        "is_welcome_email_sent": 10,
        "is_invoice_email_sent": 11,
    },
    // config
    colconf: {
        "offer_email_sender_email": 0,
        "offer_email_sender_password": 1,
        "offer_email_host_server": 2,
        "offer_email_sender_name": 3,
        "offer_email_subject": 4,
        "offer_email_template": 5,
        "offer_email_send_pdf": 6,
        "offer_email_pdf_url": 7,
        "welcome_email_sender_email": 8,
        "welcome_email_sender_password": 9,
        "welcome_email_host_server": 10,
        "welcome_email_sender_name": 11,
        "welcome_email_subject": 12,
        "welcome_email_template": 13,
        "invoice_email_sender_email": 14,
        "invoice_email_sender_password": 15,
        "invoice_email_host_server": 16,
        "invoice_email_sender_name": 17,
        "invoice_email_subject": 18,
        "invoice_email_template": 19,
        "invoice_email_send_pdf": 20,
        "invoice_email_pdf_template": 21,
        "invoice_send_day": 22,
    },
    // stats
    colstat: {
        "last_automation_run_date": 0,
        "number_of_prospect_entries": 1,
        "number_of_offer_emails_sent": 2,
        "number_of_client_entries": 3,
        "number_of_welcome_emails_sent": 4,
        "number_of_invoice_emails_sent": 5,
        "current_invoice_number_index": 6,
    }
}
const
	_test = require('tape-promise').default
	tape = require('tape'),
	test = _test(tape),
	paramsCielo = {
        'MerchantId': '1efce832-e60d-435d-b8c1-dd3121ec4248',
        'MerchantKey': '80T5wEBXuyhBF99ANLlii5WwIlOijvHqafcQNDcD',
        'sandbox': true,
        'debug': false
	},
	cielo = require('./cielo')(paramsCielo),
	regexToken = new RegExp(/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/),
	brands = ['Visa','Master','Amex','Elo','Aura','JCB','Diners','Discover','Hipercard']

brands.forEach(brand => {
	test(brand, async (t) => {

		const tokenParams = {
			"CustomerName": "Comprador Teste Cielo",
			"CardNumber": "4532117080573700",
			"Holder": "Comprador T Cielo",
			"ExpirationDate": "12/2021",
			"Brand": brand
		};
		const token = await cielo.cards.createTokenizedCard(tokenParams);
	
		const vendaParams = {
			"MerchantOrderId":"CieloNodeJS000001",
			"Customer":{
			   "Name":"Comprador Teste"
			},
			"Payment":{
			  "Type":"CreditCard",
			  "Amount":100,
			  "Installments":1,
			  "SoftDescriptor":"123456789ABCD",
			  "CreditCard":{
				  "CardToken": token.CardToken,
				  "SecurityCode":"262",
				  "Brand":brand
			  }
			}
		}
		const venda = await cielo.creditCard.simpleTransaction(vendaParams);
	
		const capturaParams = {
			paymentId: venda.Payment.PaymentId,
			amount: 70
		}
		const captura = await cielo.creditCard.captureSaleTransaction(capturaParams);
	
		const consultaParams = {
			paymentId: venda.Payment.PaymentId
		}
		const consultaPaymentId = await cielo.consulting.sale(consultaParams);

		const consultaParamsMerchantOrderId = {
			merchantOrderId: "CieloNodeJS000001"
		}

		const consultaMerchantOrderId = await cielo.consulting.sale(consultaParamsMerchantOrderId);

	
		t.assert('CardToken' in token, 'retorno cardToken correto');
		t.assert(regexToken.test(token.CardToken), 'CardToken válido');
		t.assert(venda.Payment.Status === 1, 'Status da Venda Correto');
		t.assert(regexToken.test(venda.Payment.PaymentId), 'venda.Payment.PaymentId válido');
		t.assert(consultaPaymentId.Payment.Status == 2 || consultaPaymentId.Payment.Status == 1, 'Consulta de venda correta');
		t.assert(consultaMerchantOrderId.Payments.filter(x => x.PaymentId == venda.Payment.PaymentId).length > 0, 'Consulta de MerchantOrderId correta')
		t.assert(venda.Payment.Tid === consultaPaymentId.Payment.Tid, 'Tid da Venda Correto');
		t.assert(venda.Payment.Amount === vendaParams.Payment.Amount, 'Valor da Transação de Venda correto');
		t.assert(captura.Status === 2, 'Status da Caputra correto');
		t.assert(consultaPaymentId.Payment.CapturedAmount == capturaParams.amount, 'Valor da captura parcial correto');
	
		t.end();
	})
});

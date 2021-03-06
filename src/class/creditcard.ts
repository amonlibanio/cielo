import { CancelTransactionResponseModel } from './../models/credit-card/cancel-transaction.response.model';
import { Utils, IHttpRequestOptions, HttpRequestMethodEnum } from './utils';
import { CieloTransactionInterface } from "../interface/cielo-transaction.interface";
import {
  TransactionCreditCardRequestModel,
  TransactionCreditCardResponseModel,
  CaptureRequestModel,
  CaptureResponseModel,
  CancelTransactionRequestModel
} from '../models/credit-card';

export class CreditCard {
  private cieloTransactionParams: CieloTransactionInterface;

  constructor(transaction: CieloTransactionInterface) {
    this.cieloTransactionParams = transaction;
  }

  public transaction(transaction: TransactionCreditCardRequestModel): Promise<TransactionCreditCardResponseModel> {
        const util = new Utils(this.cieloTransactionParams);
        const options: IHttpRequestOptions = util.getHttpRequestOptions({
          method: HttpRequestMethodEnum.POST,
          path: "/1/sales",
          hostname: this.cieloTransactionParams.hostnameTransacao,
        });
        return util.request<TransactionCreditCardResponseModel>(options, transaction);
  }

  public captureSaleTransaction(transaction: CaptureRequestModel): Promise<CaptureResponseModel> {
      const util = new Utils(this.cieloTransactionParams);
      const options: IHttpRequestOptions = util.getHttpRequestOptions({
        method: HttpRequestMethodEnum.PUT,
        path: `/1/sales/${transaction.paymentId}/capture`,
        hostname: this.cieloTransactionParams.hostnameTransacao,
      });

      if (transaction.amount && transaction.amount > 0) {
        options.path = `${options.path}?amount=${transaction.amount}`;
      }

      return util.request<CaptureResponseModel>(options, {});
  }

  public cancelTransaction(cancelTransactionRequest: CancelTransactionRequestModel): Promise<CancelTransactionResponseModel> {
      const util = new Utils(this.cieloTransactionParams);
      // Caso seja passado o valor do cancelamento, adiciona na url
      const amount = (cancelTransactionRequest.amount) ? `?amount=${cancelTransactionRequest.amount}` : '';
      const path = (cancelTransactionRequest.paymentId) ? `/1/sales/${cancelTransactionRequest.paymentId}/void${amount}` : `/1/sales/OrderId/${cancelTransactionRequest.merchantOrderId}/void${amount}`
      const options: IHttpRequestOptions = util.getHttpRequestOptions({
        method: HttpRequestMethodEnum.PUT,
        path: path,
        hostname: this.cieloTransactionParams.hostnameTransacao,
      });
      return util.request<CancelTransactionResponseModel>(options, {})
  }
}

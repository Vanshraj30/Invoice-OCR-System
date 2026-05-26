import torch
import torch.nn as nn


class InvoiceBiLSTM(nn.Module):

    def __init__(
        self,
        vocab_size=1000,
        embedding_dim=64,
        hidden_dim=128,
        output_dim=5
    ):

        super().__init__()

        self.embedding = nn.Embedding(
            vocab_size,
            embedding_dim
        )

        self.bilstm = nn.LSTM(
            embedding_dim,
            hidden_dim,
            bidirectional=True,
            batch_first=True
        )

        self.fc = nn.Linear(
            hidden_dim * 2,
            output_dim
        )

    def forward(self, x):

        embedded = self.embedding(x)

        lstm_out, _ = self.bilstm(
            embedded
        )

        output = self.fc(
            lstm_out
        )

        return output
def bilstm_extract(text):
    
    tokens = text.split()

    token_ids = [
        min(len(token), 999)
        for token in tokens
    ]

    if not token_ids:
        return {
            "sequence_length": 0,
            "ai_extraction": False
        }

    model = InvoiceBiLSTM()

    input_tensor = torch.tensor(
        [token_ids],
        dtype=torch.long
    )

    output = model(
        input_tensor
    )

    return {
        "sequence_length": len(tokens),
        "ai_extraction": True,
        "tensor_shape": list(
            output.shape
        )
    }    
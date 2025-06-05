const contractAddress = "0x41014b7b965e42e15aa94a6336a6b6c3e1e205ca"; // địa chỉ smart contract
const abi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "startPrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "reservePrice",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			}
		],
		"name": "AuctionCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "AuctionEnded",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			}
		],
		"name": "buy",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_startPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_reservePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_duration",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_name",
				"type": "string"
			}
		],
		"name": "createAuction",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "auctionCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "auctions",
		"outputs": [
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "startPrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "reservePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "startTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "duration",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "ended",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "name",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "auctionId",
				"type": "uint256"
			}
		],
		"name": "getCurrentPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let contract, provider, signer;

async function load() {
	if (typeof window.ethereum === 'undefined') {
		alert('Cần cài đặt MetaMask!');
		return;
	}

	provider = new ethers.providers.Web3Provider(window.ethereum);
	await provider.send("eth_requestAccounts", []);
	signer = provider.getSigner();
	contract = new ethers.Contract(contractAddress, abi, signer);

	renderAuctions();
}

async function renderAuctions() {
	const container = document.getElementById("list");
	container.innerHTML = "";

	const count = await contract.auctionCount();

	for (let i = 1; i <= count; i++) {
    const item = await contract.auctions(i);

    const now = Math.floor(Date.now() / 1000);
    const deadline = item.startTime.toNumber() + item.duration.toNumber();

    // Ẩn phiên đấu giá nếu đã hết thời gian và chưa có ai mua (buyer == 0x0)
    if (deadline < now && item.buyer === "0x0000000000000000000000000000000000000000") {
        continue; // bỏ qua không hiển thị
    }

    const price = await contract.getCurrentPrice(i);

    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded shadow";
    div.id = `auction-${i}`;

    div.innerHTML = `
        <h2 class="text-xl font-bold mb-1">🛒 ${item.name}</h2>
        <p><strong>Sản phẩm #${i}</strong></p>
        <p>💰 Giá hiện tại: <strong class="price">${ethers.utils.formatEther(price)} ETH</strong></p>
        <p>⏳ Thời gian còn lại: <span class="time-left">...</span></p>
        <p>👤 Người mua: ${item.buyer === "0x0000000000000000000000000000000000000000" ? "Chưa có" : item.buyer}</p>
        <button class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded" onclick="buy(${i})" ${item.buyer !== "0x0000000000000000000000000000000000000000" ? "disabled" : ""}>
            Mua ngay
        </button>
    `;

    container.appendChild(div);

    updateCountdown(i, deadline);
    updatePrice(i);
}



}

function updateCountdown(id, deadline) {
	const timer = setInterval(() => {
		const now = Math.floor(Date.now() / 1000);
		const remaining = Math.max(0, deadline - now);
		const el = document.querySelector(`#auction-${id} .time-left`);
		if (el) el.textContent = `${remaining} giây`;

		if (remaining <= 0) {
			clearInterval(timer);
		}
	}, 1000);
}

function updatePrice(id) {
	const priceTimer = setInterval(async () => {
		const el = document.querySelector(`#auction-${id} .price`);
		if (!el) return;
		const price = await contract.getCurrentPrice(id);
		el.textContent = `${ethers.utils.formatEther(price)} ETH`;
	}, 3000);
}

async function buy(id) {
	const price = await contract.getCurrentPrice(id);
	const tx = await contract.buy(id, { value: price });
	await tx.wait();
	alert("Mua thành công!");
	renderAuctions();
}

window.onload = load;

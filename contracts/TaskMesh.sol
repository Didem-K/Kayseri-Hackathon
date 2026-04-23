// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TaskMesh
 * @notice Simple escrow contract for task-based payments.
 *         Compatible with Monad Testnet (EVM-equivalent).
 *
 * Flow:
 *   1. Owner calls depositTask() with ETH → funds locked
 *   2. Owner calls assignTask() → contributor is set
 *   3. Contributor calls completeTask() → marks work done
 *   4. Owner calls releasePayment() → ETH sent to contributor
 */
contract TaskMesh {
    enum TaskState {
        Created,    // 0
        Assigned,   // 1
        InProgress, // 2
        Done,       // 3
        Paid        // 4
    }

    struct Task {
        uint256 id;
        address payable assignee;
        uint256 payment; // wei
        TaskState state;
    }

    address public owner;
    uint256 public taskCount;
    mapping(uint256 => Task) public tasks;

    // ---- Events ----
    event TaskCreated(uint256 indexed taskId, uint256 payment);
    event TaskAssigned(uint256 indexed taskId, address indexed assignee);
    event TaskDone(uint256 indexed taskId);
    event PaymentReleased(uint256 indexed taskId, address indexed assignee, uint256 amount);

    // ---- Modifiers ----
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ---- Owner actions ----

    /**
     * @notice Deposit ETH and create a task escrow.
     * @return taskId The ID of the newly created task.
     */
    function depositTask() external payable returns (uint256 taskId) {
        require(msg.value > 0, "Payment required");
        taskId = ++taskCount;
        tasks[taskId] = Task({
            id: taskId,
            assignee: payable(address(0)),
            payment: msg.value,
            state: TaskState.Created
        });
        emit TaskCreated(taskId, msg.value);
    }

    /**
     * @notice Assign a task to a contributor address.
     */
    function assignTask(uint256 taskId, address payable assignee) external onlyOwner {
        Task storage t = tasks[taskId];
        require(t.state == TaskState.Created, "Already assigned");
        require(assignee != address(0), "Invalid assignee");
        t.assignee = assignee;
        t.state = TaskState.Assigned;
        emit TaskAssigned(taskId, assignee);
    }

    // ---- Contributor actions ----

    /**
     * @notice Contributor marks themselves as starting work.
     */
    function startTask(uint256 taskId) external {
        Task storage t = tasks[taskId];
        require(t.state == TaskState.Assigned, "Not assigned");
        require(msg.sender == t.assignee, "Not assignee");
        t.state = TaskState.InProgress;
    }

    /**
     * @notice Contributor marks the task as completed.
     */
    function completeTask(uint256 taskId) external {
        Task storage t = tasks[taskId];
        require(
            t.state == TaskState.Assigned || t.state == TaskState.InProgress,
            "Invalid state"
        );
        require(msg.sender == t.assignee, "Not assignee");
        t.state = TaskState.Done;
        emit TaskDone(taskId);
    }

    // ---- Owner approves + releases payment ----

    /**
     * @notice Owner approves completion and releases ETH to the contributor.
     *         AI validation is simulated off-chain; owner decision is final.
     */
    function releasePayment(uint256 taskId) external onlyOwner {
        Task storage t = tasks[taskId];
        require(t.state == TaskState.Done, "Task not done");
        require(t.assignee != address(0), "No assignee");

        uint256 amount = t.payment;
        t.payment = 0;
        t.state = TaskState.Paid;

        (bool sent, ) = t.assignee.call{value: amount}("");
        require(sent, "Transfer failed");

        emit PaymentReleased(taskId, t.assignee, amount);
    }

    // ---- View ----

    function getTask(uint256 taskId)
        external
        view
        returns (
            uint256 id,
            address assignee,
            uint256 payment,
            TaskState state
        )
    {
        Task storage t = tasks[taskId];
        return (t.id, t.assignee, t.payment, t.state);
    }

    /**
     * @notice Emergency withdrawal in case a task is stuck (owner only).
     *         Only callable on Created tasks (before assignment).
     */
    function cancelTask(uint256 taskId) external onlyOwner {
        Task storage t = tasks[taskId];
        require(t.state == TaskState.Created, "Cannot cancel");
        uint256 amount = t.payment;
        t.payment = 0;
        t.state = TaskState.Paid; // reuse Paid as terminal state
        (bool sent, ) = payable(owner).call{value: amount}("");
        require(sent, "Refund failed");
    }
}
